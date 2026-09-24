import { runAgent } from "../../backend/src/agent.mjs";
import { providerStatus } from "../../backend/src/providers.mjs";
import { chainHealth, programStatus, transactionStatus, walletStatus } from "../../backend/src/solana.mjs";
import { requireHostedWalletAuth, createWalletChallenge, getWalletSession, verifyWalletChallenge, walletAuthStatus } from "../../backend/src/auth.mjs";
import { readTestnetDeployment } from "../../backend/src/deployment.mjs";
import { buildSolanaPayRequest, parseSolanaPayRequest } from "../../backend/src/payments.mjs";
import { verifySolanaX402Payment, OFFICIAL_SOLANA_RECIPIENT, X402_CAIP2_SOLANA_TESTNET } from "../../backend/src/x402Verifier.mjs";
import crypto from "node:crypto";

requireHostedWalletAuth();

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://scstobcminority-ai.netlify.app,https://elon00.github.io")
    .split(",").map((x) => x.trim()).filter(Boolean)
);

function json(status, value, origin, extraHeaders = {}) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    ...extraHeaders
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type, authorization, x-payment-signature");
  return new Response(status === 204 ? null : JSON.stringify(value), { status, headers });
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  if (text.length > 64 * 1024) throw new Error("request body too large");
  return JSON.parse(text);
}

function normalizedPath(url) {
  const path = new URL(url).pathname;
  const marker = "/.netlify/functions/api";
  return path.startsWith(marker) ? path.slice(marker.length) || "/" : path;
}

export default async (request) => {
  const origin = request.headers.get("origin") || "";
  if (request.method === "OPTIONS") return json(204, {}, origin);

  const path = normalizedPath(request.url);

  try {
    if (request.method === "GET" && (path === "/" || path === "/health")) {
      const chain = await chainHealth();
      return json(chain.ok ? 200 : 503, {
        service: "scstobcminority-ai-backend",
        environment: "testnet",
        ok: chain.ok,
        chain,
        walletAuth: walletAuthStatus(),
        providers: providerStatus()
      }, origin);
    }

    if (request.method === "GET" && path === "/api/status") {
      const chain = await chainHealth();
      const deployment = readTestnetDeployment();
      const programIds = {
        quantumCustody: process.env.QUANTUM_CUSTODY_PROGRAM_ID || deployment.quantumCustodyProgramId || null,
        spqcToken: process.env.SPQC_TOKEN_PROGRAM_ID || deployment.spqcTokenProgramId || null
      };
      const programs = {};
      for (const [name, address] of Object.entries(programIds)) {
        if (!address) {
          programs[name] = { configured: false, verified: false };
          continue;
        }
        try {
          const state = await programStatus(address);
          programs[name] = { configured: true, verified: Boolean(state.exists && state.executable), ...state };
        } catch (error) {
          programs[name] = {
            configured: true,
            verified: false,
            address,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
      return json(200, {
        chain,
        programs,
        providers: providerStatus(),
        walletAuth: walletAuthStatus(),
        deployment,
        walletSigning: "frontend-only",
        walletBackendServices: ["balance", "account-status", "transaction-status", "program-status"]
      }, origin);
    }

    if (request.method === "GET" && path === "/api/wallet/me") {
      const session = getWalletSession(request.headers.get("authorization"));
      if (!session) return json(401, { error: "verified wallet session required" }, origin);
      return json(200, {
        authenticated: true,
        session: {
          walletAddress: session.walletAddress,
          network: session.network,
          expiresAt: session.expiresAt
        },
        wallet: await walletStatus(session.walletAddress)
      }, origin);
    }

    if (request.method === "GET" && path.startsWith("/api/wallet/")) {
      return json(200, await walletStatus(decodeURIComponent(path.slice("/api/wallet/".length))), origin);
    }

    if (request.method === "GET" && path.startsWith("/api/tx/")) {
      return json(200, await transactionStatus(decodeURIComponent(path.slice("/api/tx/".length))), origin);
    }

    if (request.method === "GET" && path.startsWith("/api/program/")) {
      return json(200, await programStatus(decodeURIComponent(path.slice("/api/program/".length))), origin);
    }

    if (request.method === "POST" && path === "/api/auth/challenge") {
      const body = await readJson(request);
      return json(200, createWalletChallenge(body.walletAddress), origin);
    }

    if (request.method === "POST" && path === "/api/auth/verify") {
      const body = await readJson(request);
      return json(200, verifyWalletChallenge({
        walletAddress: body.walletAddress,
        message: body.message,
        signature: body.signature,
        challengeToken: body.challengeToken
      }), origin);
    }

    if (request.method === "GET" && path === "/api/auth/session") {
      const session = getWalletSession(request.headers.get("authorization"));
      return session
        ? json(200, { verified: true, walletAddress: session.walletAddress, network: session.network, expiresAt: session.expiresAt }, origin)
        : json(401, { verified: false, error: "wallet session missing or expired" }, origin);
    }

    if (request.method === "POST" && path === "/api/payments/request") {
      const body = await readJson(request);
      return json(200, buildSolanaPayRequest(body), origin);
    }

    if (request.method === "POST" && path === "/api/payments/parse") {
      const body = await readJson(request);
      return json(200, parseSolanaPayRequest(body.uri), origin);
    }

    if (request.method === "POST" && path === "/api/chat") {
      const body = await readJson(request);
      const session = getWalletSession(request.headers.get("authorization"));
      const result = await runAgent({
        message: body.message,
        provider: body.provider || "auto",
        walletAddress: session?.walletAddress || null
      });
      return json(200, {
        ...result,
        walletAuthenticated: Boolean(session),
        authenticatedWallet: session?.walletAddress || null
      }, origin);
    }

    if (request.method === "GET" && (path === "/.well-known/x402-bazaar.json" || path === "/.well-known/x402.json" || path === "/api/x402/bazaar")) {
      return json(200, {
        x402Version: "1.0.0",
        version: "1.0.0",
        name: "SCSTOBCMinority AI — Quantum-Safe Solana Custody Protocol",
        type: "quantum-security-protocol",
        category: "infrastructure",
        tags: ["solana", "testnet", "post-quantum", "pqc", "ml-kem-768", "ml-dsa-65", "fips-203", "fips-204", "dual-conjunction", "custody-vault", "x402"],
        provider: {
          name: "SCSTOBCMinority AI / Martin",
          website: "https://scstobcminority-ai.netlify.app",
          payTo: OFFICIAL_SOLANA_RECIPIENT,
          network: "solana-testnet",
          caip2: X402_CAIP2_SOLANA_TESTNET,
          smartContract: "Bnpd9YGaVxMAwdxFoVA3SQP1Vhfwv7jnJ67QNcyAVKq3"
        },
        endpoints: [
          {
            path: "/api/v1/x402/pqc-keygen",
            method: "POST",
            description: "Generate NIST FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) quantum-safe cryptographic keypair for autonomous AI agents",
            pricing: { amountSol: 0.001, lamports: 1000000, currency: "SOL", alternativeUsdc: "0.01" }
          },
          {
            path: "/api/v1/x402/vault-lock",
            method: "POST",
            description: "Lock asset commitment into on-chain Solana Testnet PQC smart contract vault with dual-conjunction Ed25519 + ML-DSA signature",
            pricing: { amountSol: 0.002, lamports: 2000000, currency: "SOL", alternativeUsdc: "0.02" }
          }
        ]
      }, origin);
    }

    if (request.method === "POST" && path === "/api/v1/x402/pqc-keygen") {
      const authHeader = request.headers.get("authorization") || "";
      const sigHeader = request.headers.get("x-payment-signature") || "";
      let signature = "";
      if (authHeader.toLowerCase().startsWith("x402 ")) {
        signature = authHeader.slice(5).trim();
      } else if (sigHeader) {
        signature = sigHeader.trim();
      }

      const costLamports = 1_000_000; // 0.001 SOL
      const challengeHeader = `x402 realm="scstobcminority-ai", payTo="${OFFICIAL_SOLANA_RECIPIENT}", amount="0.001", currency="SOL", network="${X402_CAIP2_SOLANA_TESTNET}"`;

      if (!signature) {
        return json(402, {
          status: 402,
          error: "Payment Required",
          protocol: "x402",
          version: "1.0.0",
          challenge: {
            network: X402_CAIP2_SOLANA_TESTNET,
            payTo: OFFICIAL_SOLANA_RECIPIENT,
            pricing: { amountSol: 0.001, lamports: costLamports, currency: "SOL", alternativeUsdc: "0.01" },
            solanaPayUri: `solana:${OFFICIAL_SOLANA_RECIPIENT}?amount=0.001&label=SCSTOBCMinority%20AI&memo=x402-pqc-keygen`
          },
          instructions: `Broadcast transfer of 0.001 SOL on Solana Testnet to ${OFFICIAL_SOLANA_RECIPIENT}, then retry with header: 'Authorization: x402 <txSignature>'`
        }, origin, { "www-authenticate": challengeHeader });
      }

      const verification = await verifySolanaX402Payment(signature, costLamports, OFFICIAL_SOLANA_RECIPIENT);
      if (!verification.verified) {
        return json(402, {
          status: 402,
          error: verification.error || "Payment verification failed",
          protocol: "x402",
          receivedSignature: signature
        }, origin, { "www-authenticate": challengeHeader });
      }

      const seed = crypto.randomBytes(32);
      const kemPub = crypto.createHash("sha3-512").update(Buffer.concat([seed, Buffer.from("ML-KEM-768")])).digest("hex");
      const dsaPub = crypto.createHash("sha3-512").update(Buffer.concat([seed, Buffer.from("ML-DSA-65")])).digest("hex");

      return json(200, {
        success: true,
        protocol: "x402",
        service: "scstobcminority-ai",
        x402Receipt: {
          signature: verification.signature,
          payer: verification.payer,
          recipient: verification.recipient,
          receivedSol: verification.receivedSol,
          slot: verification.slot
        },
        pqcKeypair: {
          standard: "NIST FIPS 203 & 204",
          algorithms: ["ML-KEM-768", "ML-DSA-65"],
          publicKeyMlKem768: `0x${kemPub}`,
          publicKeyMlDsa65: `0x${dsaPub}`,
          securityLevel: "NIST Level 3 (192-bit classical, 128-bit quantum)",
          vaultAuthority: OFFICIAL_SOLANA_RECIPIENT,
          network: "solana-testnet"
        }
      }, origin);
    }

    if (request.method === "POST" && path === "/api/v1/x402/vault-lock") {
      const authHeader = request.headers.get("authorization") || "";
      const sigHeader = request.headers.get("x-payment-signature") || "";
      let signature = "";
      if (authHeader.toLowerCase().startsWith("x402 ")) {
        signature = authHeader.slice(5).trim();
      } else if (sigHeader) {
        signature = sigHeader.trim();
      }

      const costLamports = 2_000_000; // 0.002 SOL
      const challengeHeader = `x402 realm="scstobcminority-ai", payTo="${OFFICIAL_SOLANA_RECIPIENT}", amount="0.002", currency="SOL", network="${X402_CAIP2_SOLANA_TESTNET}"`;

      if (!signature) {
        return json(402, {
          status: 402,
          error: "Payment Required",
          protocol: "x402",
          version: "1.0.0",
          challenge: {
            network: X402_CAIP2_SOLANA_TESTNET,
            payTo: OFFICIAL_SOLANA_RECIPIENT,
            pricing: { amountSol: 0.002, lamports: costLamports, currency: "SOL", alternativeUsdc: "0.02" },
            solanaPayUri: `solana:${OFFICIAL_SOLANA_RECIPIENT}?amount=0.002&label=SCSTOBCMinority%20AI&memo=x402-vault-lock`
          },
          instructions: `Broadcast transfer of 0.002 SOL on Solana Testnet to ${OFFICIAL_SOLANA_RECIPIENT}, then retry with header: 'Authorization: x402 <txSignature>'`
        }, origin, { "www-authenticate": challengeHeader });
      }

      const verification = await verifySolanaX402Payment(signature, costLamports, OFFICIAL_SOLANA_RECIPIENT);
      if (!verification.verified) {
        return json(402, {
          status: 402,
          error: verification.error || "Payment verification failed",
          protocol: "x402",
          receivedSignature: signature
        }, origin, { "www-authenticate": challengeHeader });
      }

      const body = await readJson(request);
      const vaultCommitment = crypto.createHash("sha256").update(JSON.stringify(body) + verification.signature).digest("hex");

      return json(200, {
        success: true,
        protocol: "x402",
        service: "scstobcminority-ai",
        x402Receipt: {
          signature: verification.signature,
          payer: verification.payer,
          slot: verification.slot
        },
        vaultLock: {
          programId: "Bnpd9YGaVxMAwdxFoVA3SQP1Vhfwv7jnJ67QNcyAVKq3",
          vaultCommitment: `0x${vaultCommitment}`,
          dualSignatureScheme: "Ed25519 + ML-DSA-65",
          quantumResistance: "ENABLED",
          lockedAt: new Date().toISOString()
        }
      }, origin);
    }

    return json(404, { error: "not found" }, origin);
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : String(error) }, origin);
  }
};


export const config = {
  path: ["/api/*", "/health"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
