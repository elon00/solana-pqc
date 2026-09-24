import test from "node:test";
import assert from "node:assert/strict";
import { decodePaymentHeader, X402_VERSION } from "../src/x402V2.mjs";

test("x402 v2 payment header decoder accepts base64 JSON", () => {
  const payload = { x402Version: 2, accepted: { scheme: "exact" }, payload: {} };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  assert.deepEqual(decodePaymentHeader(encoded), payload);
  assert.equal(X402_VERSION, 2);
});

test("x402 v2 payment header decoder rejects malformed input", () => {
  assert.throws(() => decodePaymentHeader("not-base64-json"), /Invalid PAYMENT-SIGNATURE/);
});
