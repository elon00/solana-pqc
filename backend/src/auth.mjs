import crypto from "node:crypto";
import { looksLikeBase58 } from "./solana.mjs";

const challenges = new Map();
const sessions = new Map();
const CHALLENGE_TTL_MS = Number(process.env.WALLET_CHALLENGE_TTL_MS || 5 * 60_000);
const SESSION_TTL_MS = Number(process.env.WALLET_SESSION_TTL_MS || 30 * 60_000);
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

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

function cleanup() {
  const now = Date.now();
  for (const [key, value] of challenges) if (value.expiresAt <= now) challenges.delete(key);
  for (const [key, value] of sessions) if (value.expiresAt <= now) sessions.delete(key);
}

export function createWalletChallenge(walletAddress) {
  cleanup();
  if (!looksLikeBase58(walletAddress, 32, 44)) throw new Error("Invalid Solana wallet address");
  const nonce = crypto.randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const message = [
    "SCSTOBCMinority AI wallet authentication",
    "Network: Solana Testnet",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
    "",
    "Signing proves wallet ownership only. It does not authorize a transaction or transfer funds."
  ].join("\n");
  challenges.set(walletAddress, { message, expiresAt });
  return { walletAddress, network: "testnet", message, expiresAt };
}

export function verifyWalletChallenge({ walletAddress, message, signature }) {
  cleanup();
  if (!looksLikeBase58(walletAddress, 32, 44)) throw new Error("Invalid Solana wallet address");
  const challenge = challenges.get(walletAddress);
  if (!challenge || challenge.expiresAt <= Date.now()) throw new Error("Wallet challenge expired or missing");
  if (message !== challenge.message) throw new Error("Wallet challenge mismatch");

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

  challenges.delete(walletAddress);
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { walletAddress, expiresAt });
  return { verified: true, walletAddress, network: "testnet", token, expiresAt };
}

export function getWalletSession(authorization) {
  cleanup();
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) return null;
  return { token, ...session, network: "testnet" };
}

export function revokeWalletSession(authorization) {
  const session = getWalletSession(authorization);
  if (!session) return false;
  sessions.delete(session.token);
  return true;
}
