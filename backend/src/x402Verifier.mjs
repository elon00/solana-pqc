import { looksLikeBase58, TESTNET_RPC_URL } from "./solana.mjs";

export const OFFICIAL_SOLANA_RECIPIENT = process.env.X402_RECIPIENT_WALLET || "BPshPrMazV7qunhcq18AvCHjSceHbKytiRDNrtCv68g3";
export const X402_CAIP2_SOLANA_TESTNET = "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";

// In-Memory Replay Protection Cache (stores confirmed signature hashes)
const USED_TX_SIGNATURES = new Set();

/**
 * Verifies a Solana transaction for x402 settlement.
 * @param {string} signature - The 88-character base58 Solana transaction signature.
 * @param {number} minLamports - Minimum required amount in lamports (e.g. 1_000_000 for 0.001 SOL).
 * @param {string} recipientAddress - Expected recipient address.
 */
export async function verifySolanaX402Payment(signature, minLamports = 1_000_000, recipientAddress = OFFICIAL_SOLANA_RECIPIENT) {
  const cleanSig = (signature || "").trim();

  if (!looksLikeBase58(cleanSig, 64, 88)) {
    return {
      verified: false,
      error: "Invalid Solana transaction signature format. Must be an 88-character base58 signature."
    };
  }

  // Prevent Replay Attacks
  if (USED_TX_SIGNATURES.has(cleanSig)) {
    return {
      verified: false,
      error: "Replay Attack Detected: This Solana payment signature has already been claimed."
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const rpcRes = await fetch(TESTNET_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "x402-verify",
        method: "getTransaction",
        params: [
          cleanSig,
          {
            encoding: "jsonParsed",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!rpcRes.ok) {
      return { verified: false, error: `Solana RPC returned HTTP ${rpcRes.status}` };
    }

    const payload = await rpcRes.json();
    if (payload.error) {
      return { verified: false, error: payload.error.message || "Solana RPC query error" };
    }

    const tx = payload.result;
    if (!tx) {
      return { verified: false, error: "Transaction not yet found or confirmed on Solana Testnet. Wait 1 slot and retry." };
    }

    if (tx.meta?.err) {
      return { verified: false, error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };
    }

    // Inspect accounts and balance change
    const accountKeys = tx.transaction?.message?.accountKeys || [];
    let recipientIndex = -1;

    for (let i = 0; i < accountKeys.length; i++) {
      const pubkey = typeof accountKeys[i] === "string" ? accountKeys[i] : accountKeys[i]?.pubkey;
      if (pubkey === recipientAddress) {
        recipientIndex = i;
        break;
      }
    }

    if (recipientIndex === -1) {
      return {
        verified: false,
        error: `Invalid Recipient: Payment did not include official address ${recipientAddress}.`
      };
    }

    const preBalance = tx.meta?.preBalances?.[recipientIndex] ?? 0;
    const postBalance = tx.meta?.postBalances?.[recipientIndex] ?? 0;
    const receivedLamports = postBalance - preBalance;

    if (receivedLamports < minLamports) {
      return {
        verified: false,
        error: `Insufficient Payment: Recipient received ${receivedLamports} lamports (${receivedLamports / 1e9} SOL), expected at least ${minLamports} lamports (${minLamports / 1e9} SOL).`
      };
    }

    // Mark as consumed
    USED_TX_SIGNATURES.add(cleanSig);

    const payer = typeof accountKeys[0] === "string" ? accountKeys[0] : accountKeys[0]?.pubkey;

    return {
      verified: true,
      signature: cleanSig,
      payer,
      recipient: recipientAddress,
      receivedLamports,
      receivedSol: receivedLamports / 1e9,
      slot: tx.slot,
      blockTime: tx.blockTime
    };
  } catch (err) {
    return {
      verified: false,
      error: `Verification error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
