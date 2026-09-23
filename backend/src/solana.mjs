const DEFAULT_RPC = "https://api.testnet.solana.com";

export const TESTNET_RPC_URL = process.env.SOLANA_RPC_URL || DEFAULT_RPC;

async function rpc(method, params = [], timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(TESTNET_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Solana RPC error");
    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}

export function looksLikeBase58(value, min = 32, max = 88) {
  return typeof value === "string" &&
    value.length >= min &&
    value.length <= max &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

export async function chainHealth() {
  try {
    const [version, slot, blockHeight] = await Promise.all([
      rpc("getVersion"),
      rpc("getSlot", [{ commitment: "confirmed" }]),
      rpc("getBlockHeight", [{ commitment: "confirmed" }])
    ]);
    return {
      ok: true,
      network: "testnet",
      rpcUrl: TESTNET_RPC_URL,
      version: version?.["solana-core"] || null,
      slot,
      blockHeight
    };
  } catch (error) {
    return {
      ok: false,
      network: "testnet",
      rpcUrl: TESTNET_RPC_URL,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function walletStatus(address) {
  if (!looksLikeBase58(address, 32, 44)) throw new Error("Invalid Solana wallet address");
  const [balance, info] = await Promise.all([
    rpc("getBalance", [address, { commitment: "confirmed" }]),
    rpc("getAccountInfo", [address, { encoding: "base64", commitment: "confirmed" }])
  ]);
  return {
    address,
    network: "testnet",
    lamports: balance?.value ?? 0,
    sol: (balance?.value ?? 0) / 1_000_000_000,
    accountExists: Boolean(info?.value),
    executable: Boolean(info?.value?.executable),
    owner: info?.value?.owner ?? null
  };
}

export async function transactionStatus(signature) {
  if (!looksLikeBase58(signature, 64, 88)) throw new Error("Invalid Solana transaction signature");
  const result = await rpc("getSignatureStatuses", [[signature], { searchTransactionHistory: true }]);
  const status = result?.value?.[0] ?? null;
  return {
    signature,
    network: "testnet",
    found: Boolean(status),
    confirmationStatus: status?.confirmationStatus ?? null,
    confirmations: status?.confirmations ?? null,
    slot: status?.slot ?? null,
    error: status?.err ?? null
  };
}

export async function programStatus(address) {
  if (!looksLikeBase58(address, 32, 44)) throw new Error("Invalid Solana program address");
  const result = await rpc("getAccountInfo", [address, { encoding: "base64", commitment: "confirmed" }]);
  return {
    address,
    network: "testnet",
    exists: Boolean(result?.value),
    executable: Boolean(result?.value?.executable),
    owner: result?.value?.owner ?? null,
    lamports: result?.value?.lamports ?? 0
  };
}
