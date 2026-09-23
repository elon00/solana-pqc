import crypto from "node:crypto";
import { looksLikeBase58 } from "./solana.mjs";

const CHALLENGE_TTL_MS = Number(process.env.WALLET_CHALLENGE_TTL_MS || 5 * 60_000);
const SESSION_TTL_MS = Number(process.env.WALLET_SESSION_TTL_MS || 30 * 60_000);
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function authSecret() {
  const configured = String(process.env.WALLET_AUTH_SECRET || "");
  if (configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("WALLET_AUTH_SECRET is not configured");
  }
  return "scstobcminority-ai-local-test-wallet-auth-secret";
}

function signPart(part) {
  return crypto.createHmac("sha256", authSecret()).update(part).digest("base64url");
}

function issueToken(payload) {
  const part = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${part}.${signPart(part)}`;
}

function readToken(token, expectedType) {
  const value = String(token || "");
  const [part, signature, extra] = value.split(".");
  if (!part || !signature || extra) throw new Error("Invalid wallet auth token");
  const expected = Buffer.from(signPart(part), "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new Error("Invalid wallet auth token signature");
  }
  const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  if (payload?.typ !== expectedType) throw new Error("Invalid wallet auth token type");
  if (!Number.isFinite(payload?.exp) || payload.exp <= Date.now()) throw new Error("Wallet auth token expired");
  return payload;
}

function decodeBase58(value) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const map = new Map([...alphabet].map((c, i) => [c, i]));
  const bytes = [0];
  for (const char of value) {
    const n = map.get(char);
    if (n === undefined) throw new Error("invalid base58");
    let carry = n;
    for (let i = 0; i < bytes.length; i += 1) {
      const x = bytes[i] * 58 + carry;
      bytes[i] = x & 0xff;
      carry = x >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < value.length - 1 && value[i] === "1"; i += 1) bytes.push(0);
  return Buffer.from(bytes.reverse());
}

function challengeMessage({ walletAddress, nonce, exp }) {
  return [
    "SCSTOBCMinority AI wallet authentication",
    "Network: Solana Testnet",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(exp).toISOString()}`,
    "",
    "Signing proves wallet ownership only. It does not authorize a transaction or transfer funds."
  ].join("\n");
}

export function createWalletChallenge(walletAddress) {
  if (!looksLikeBase58(walletAddress, 32, 44)) throw new Error("Invalid Solana wallet address");
  const payload = {
    typ: "challenge",
    walletAddress,
    nonce: crypto.randomBytes(24).toString("base64url"),
    exp: Date.now() + CHALLENGE_TTL_MS
  };
  const challengeToken = issueToken(payload);
  return {
    walletAddress,
    network: "testnet",
    message: challengeMessage(payload),
    expiresAt: payload.exp,
    challengeToken
  };
}

export function verifyWalletChallenge({ walletAddress, message, signature, challengeToken }) {
  if (!looksLikeBase58(walletAddress, 32, 44)) throw new Error("Invalid Solana wallet address");
  const challenge = readToken(challengeToken, "challenge");
  if (challenge.walletAddress !== walletAddress) throw new Error("Wallet challenge mismatch");
  const expectedMessage = challengeMessage(challenge);
  if (message !== expectedMessage) throw new Error("Wallet challenge message mismatch");

  const publicKeyRaw = decodeBase58(walletAddress);
  if (publicKeyRaw.length !== 32) throw new Error("Invalid Solana Ed25519 public key");
  const signatureRaw = Buffer.from(String(signature || ""), "base64");
  if (signatureRaw.length !== 64) throw new Error("Invalid Ed25519 signature");

  const publicKey = crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, publicKeyRaw]),
    format: "der",
    type: "spki"
  });
  const verified = crypto.verify(null, Buffer.from(message, "utf8"), publicKey, signatureRaw);
  if (!verified) throw new Error("Wallet signature verification failed");

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = issueToken({
    typ: "session",
    walletAddress,
    exp: expiresAt,
    nonce: crypto.randomBytes(16).toString("base64url")
  });

  return { verified: true, walletAddress, network: "testnet", token, expiresAt };
}

export function getWalletSession(authorization) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return null;
  try {
    const token = authorization.slice(7).trim();
    const session = readToken(token, "session");
    if (!looksLikeBase58(session.walletAddress, 32, 44)) return null;
    return {
      token,
      walletAddress: session.walletAddress,
      expiresAt: session.exp,
      network: "testnet",
      stateless: true
    };
  } catch {
    return null;
  }
}

export function revokeWalletSession(authorization) {
  return Boolean(getWalletSession(authorization));
}
