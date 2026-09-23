import http from "node:http";
import { URL } from "node:url";
import { runAgent } from "./agent.mjs";
import { providerStatus } from "./providers.mjs";
import { chainHealth, programStatus, transactionStatus, walletStatus } from "./solana.mjs";
import { createWalletChallenge, getWalletSession, revokeWalletSession, verifyWalletChallenge } from "./auth.mjs";
import { readTestnetDeployment } from "./deployment.mjs";

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "0.0.0.0";
const MAX_BODY = 64 * 1024;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://elon00.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080")
    .split(",").map((x) => x.trim()).filter(Boolean)
);
const hits = new Map();

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || [...allowedOrigins].some((x) => origin.startsWith(x)))) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "Origin");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
  res.setHeader("x-content-type-options", "nosniff");
}

function send(res, status, value) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

function rateLimit(req) {
  const key = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const existing = hits.get(key) || [];
  const fresh = existing.filter((time) => now - time < 60_000);
  fresh.push(now);
  hits.set(key, fresh);
  return fresh.length <= Number(process.env.RATE_LIMIT_PER_MINUTE || 60);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!rateLimit(req)) return send(res, 429, { error: "rate limit exceeded" });

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      const chain = await chainHealth();
      return send(res, chain.ok ? 200 : 503, {
        service: "scstobcminority-ai-backend",
        environment: "testnet",
        ok: chain.ok,
        chain,
        providers: providerStatus()
      });
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
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
          programs[name] = {
            configured: true,
            verified: Boolean(state.exists && state.executable),
            ...state
          };
        } catch (error) {
          programs[name] = {
            configured: true,
            verified: false,
            address,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
      return send(res, 200, {
        chain,
        programs,
        providers: providerStatus(),
        deployment,
        walletSigning: "frontend-only",
        walletBackendServices: ["balance", "account-status", "transaction-status", "program-status"]
      });
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/wallet/")) {
      const address = decodeURIComponent(url.pathname.slice("/api/wallet/".length));
      return send(res, 200, await walletStatus(address));
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/tx/")) {
      const signature = decodeURIComponent(url.pathname.slice("/api/tx/".length));
      return send(res, 200, await transactionStatus(signature));
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/program/")) {
      const address = decodeURIComponent(url.pathname.slice("/api/program/".length));
      return send(res, 200, await programStatus(address));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/challenge") {
      const body = await readJson(req);
      return send(res, 200, createWalletChallenge(body.walletAddress));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/verify") {
      const body = await readJson(req);
      const session = verifyWalletChallenge({
        walletAddress: body.walletAddress,
        message: body.message,
        signature: body.signature
      });
      return send(res, 200, session);
    }

    if (req.method === "GET" && url.pathname === "/api/auth/session") {
      const session = getWalletSession(req.headers.authorization);
      if (!session) return send(res, 401, { verified: false, error: "wallet session missing or expired" });
      return send(res, 200, {
        verified: true,
        walletAddress: session.walletAddress,
        network: session.network,
        expiresAt: session.expiresAt
      });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      return send(res, 200, { revoked: revokeWalletSession(req.headers.authorization) });
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJson(req);
      const session = getWalletSession(req.headers.authorization);
      const result = await runAgent({
        message: body.message,
        provider: body.provider || "auto",
        walletAddress: session?.walletAddress || null
      });
      return send(res, 200, {
        ...result,
        walletAuthenticated: Boolean(session),
        authenticatedWallet: session?.walletAddress || null
      });
    }

    return send(res, 404, { error: "not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return send(res, 400, { error: message });
  }
}

export const server = http.createServer(handler);

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, HOST, () => {
    console.log(`SCSTOBCMinority AI backend listening on http://${HOST}:${PORT} (Solana Testnet)`);
  });
}
