import { runAgent } from "../../backend/src/agent.mjs";
import { providerStatus } from "../../backend/src/providers.mjs";
import { chainHealth, programStatus, transactionStatus, walletStatus } from "../../backend/src/solana.mjs";
import { createWalletChallenge, getWalletSession, verifyWalletChallenge } from "../../backend/src/auth.mjs";
import { readTestnetDeployment } from "../../backend/src/deployment.mjs";

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://scstobcminority-ai.netlify.app,https://elon00.github.io")
    .split(",").map((x) => x.trim()).filter(Boolean)
);

function json(status, value, origin) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff"
  });
  if (origin && (allowedOrigins.has(origin) || [...allowedOrigins].some((x) => origin.startsWith(x)))) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type, authorization");
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
        deployment,
        walletSigning: "frontend-only",
        walletBackendServices: ["balance", "account-status", "transaction-status", "program-status"]
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

    return json(404, { error: "not found" }, origin);
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : String(error) }, origin);
  }
};
