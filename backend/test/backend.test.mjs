import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { looksLikeBase58 } from "../src/solana.mjs";
import { providerStatus } from "../src/providers.mjs";
import { createWalletChallenge, getWalletSession, verifyWalletChallenge, walletAuthStatus } from "../src/auth.mjs";
import { buildSolanaPayRequest, parseSolanaPayRequest } from "../src/payments.mjs";

test("wallet address validation rejects invalid characters", () => {
  assert.equal(looksLikeBase58("0OIl-not-base58", 32, 44), false);
});

test("local model provider is always configured", () => {
  const status = providerStatus({});
  assert.equal(status.local.configured, true);
  assert.equal(status.openai.configured, false);
  assert.equal(status.anthropic.configured, false);
  assert.equal(status.gemini.configured, false);
});

test("providers activate only with key and model", () => {
  const status = providerStatus({
    OPENAI_API_KEY: "secret",
    OPENAI_MODEL: "example-model",
    ANTHROPIC_API_KEY: "secret",
    ANTHROPIC_MODEL: "example-model",
    GEMINI_API_KEY: "secret",
    GEMINI_MODEL: "example-model"
  });
  assert.equal(status.openai.configured, true);
  assert.equal(status.anthropic.configured, true);
  assert.equal(status.gemini.configured, true);
});


test("wallet auth challenge rejects malformed address", () => {
  assert.throws(() => createWalletChallenge("not-a-wallet"), /Invalid Solana wallet address/);
});

test("missing bearer token is never treated as an authenticated wallet", () => {
  assert.equal(getWalletSession(undefined), null);
  assert.equal(getWalletSession("Bearer unknown"), null);
});


function encodeBase58(buffer) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (!buffer.length) return "";
  const digits = [0];
  for (const byte of buffer) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      const x = digits[i] * 256 + carry;
      digits[i] = x % 58;
      carry = Math.floor(x / 58);
    }
    while (carry) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let leading = 0;
  while (leading < buffer.length && buffer[leading] === 0) leading += 1;
  return "1".repeat(leading) + digits.reverse().map((d) => alphabet[d]).join("");
}

test("wallet auth verifies a real Ed25519 signature and creates a session", () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const spki = publicKey.export({ format: "der", type: "spki" });
  const rawPublicKey = spki.subarray(spki.length - 32);
  const walletAddress = encodeBase58(rawPublicKey);
  const challenge = createWalletChallenge(walletAddress);
  const signature = crypto.sign(null, Buffer.from(challenge.message, "utf8"), privateKey).toString("base64");
  const verified = verifyWalletChallenge({
    walletAddress,
    message: challenge.message,
    signature,
    challengeToken: challenge.challengeToken
  });
  assert.equal(verified.verified, true);
  assert.equal(verified.walletAddress, walletAddress);
  const session = getWalletSession(`Bearer ${verified.token}`);
  assert.equal(session?.walletAddress, walletAddress);
});


test("Solana Pay request round-trips recipient and amount", () => {
  const recipient = "8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg";
  const request = buildSolanaPayRequest({
    recipient,
    amount: "1.250000000",
    label: "SCSTOBCMinority AI",
    message: "Testnet receive"
  });
  assert.equal(request.network, "testnet");
  assert.equal(request.recipient, recipient);
  assert.equal(request.amount, "1.25");
  assert.match(request.uri, /^solana:/);

  const parsed = parseSolanaPayRequest(request.uri);
  assert.equal(parsed.recipient, recipient);
  assert.equal(parsed.amount, "1.25");
  assert.equal(parsed.label, "SCSTOBCMinority AI");
});

test("Solana Pay rejects malformed recipients and amounts", () => {
  assert.throws(
    () => buildSolanaPayRequest({ recipient: "not-a-wallet", amount: "1" }),
    /Invalid Solana recipient address/
  );
  assert.throws(
    () => buildSolanaPayRequest({
      recipient: "8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg",
      amount: "-1"
    }),
    /Invalid SOL amount/
  );
});

test("SPL-token QR is blocked until SPQC mint is verified", () => {
  assert.throws(
    () => parseSolanaPayRequest(
      "solana:8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg?amount=1&spl-token=So11111111111111111111111111111111111111112"
    ),
    /not enabled until the SPQC mint is verified/
  );
});


test("hosted production refuses the local wallet-auth fallback", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY: process.env.NETLIFY,
    VERCEL: process.env.VERCEL,
    CONTEXT: process.env.CONTEXT,
    WALLET_AUTH_SECRET: process.env.WALLET_AUTH_SECRET
  };
  try {
    delete process.env.NODE_ENV;
    process.env.NETLIFY = "true";
    delete process.env.VERCEL;
    delete process.env.CONTEXT;
    delete process.env.WALLET_AUTH_SECRET;
    const status = walletAuthStatus();
    assert.equal(status.configured, false);
    assert.equal(status.mode, "unavailable");
    assert.throws(
      () => createWalletChallenge("8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg"),
      /WALLET_AUTH_SECRET is not configured/
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
