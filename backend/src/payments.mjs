import { looksLikeBase58 } from "./solana.mjs";

const MAX_SOL = Number(process.env.MAX_QR_SOL_AMOUNT || 1_000_000);

function validateWallet(value) {
  const wallet = String(value || "").trim();
  if (!looksLikeBase58(wallet, 32, 44)) throw new Error("Invalid Solana recipient address");
  return wallet;
}

function normalizeAmount(value, { optional = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return null;
    throw new Error("Amount is required");
  }
  const raw = String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(raw)) throw new Error("Invalid SOL amount");
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_SOL) throw new Error("SOL amount is out of range");
  return raw.includes(".") ? raw.replace(/0+$/, "").replace(/\.$/, "") : raw;
}

function safeText(value, max) {
  return String(value || "").trim().slice(0, max);
}

export function buildSolanaPayRequest({ recipient, amount, label, message, memo } = {}) {
  const wallet = validateWallet(recipient);
  const normalizedAmount = normalizeAmount(amount, { optional: true });
  const params = new URLSearchParams();
  if (normalizedAmount) params.set("amount", normalizedAmount);
  const cleanLabel = safeText(label || "SCSTOBCMinority AI", 80);
  const cleanMessage = safeText(message, 140);
  const cleanMemo = safeText(memo, 120);
  if (cleanLabel) params.set("label", cleanLabel);
  if (cleanMessage) params.set("message", cleanMessage);
  if (cleanMemo) params.set("memo", cleanMemo);
  return {
    network: "testnet",
    recipient: wallet,
    amount: normalizedAmount,
    label: cleanLabel || null,
    message: cleanMessage || null,
    memo: cleanMemo || null,
    uri: `solana:${wallet}${params.size ? `?${params.toString()}` : ""}`
  };
}

export function parseSolanaPayRequest(value) {
  const uri = String(value || "").trim();
  if (!uri.toLowerCase().startsWith("solana:")) throw new Error("QR payload is not a Solana Pay URI");
  const body = uri.slice(7);
  const q = body.indexOf("?");
  const recipient = validateWallet(q === -1 ? body : body.slice(0, q));
  const params = new URLSearchParams(q === -1 ? "" : body.slice(q + 1));
  if (params.has("spl-token")) {
    throw new Error("SPL-token QR payments are not enabled until the SPQC mint is verified on Testnet");
  }
  const amount = normalizeAmount(params.get("amount"), { optional: true });
  return {
    network: "testnet",
    recipient,
    amount,
    label: safeText(params.get("label"), 80) || null,
    message: safeText(params.get("message"), 140) || null,
    memo: safeText(params.get("memo"), 120) || null,
    uri
  };
}
