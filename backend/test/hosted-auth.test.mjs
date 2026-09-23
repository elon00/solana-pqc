import test from 'node:test';
import assert from 'node:assert/strict';
import { walletAuthStatus, createWalletChallenge } from '../src/auth.mjs';

test('serverless entrypoint disables known fallback without hosting environment flags', async () => {
  for (const key of ['NODE_ENV', 'NETLIFY', 'VERCEL', 'CONTEXT', 'WALLET_AUTH_SECRET']) delete process.env[key];
  assert.equal(walletAuthStatus().mode, 'local-test-fallback');
  await import('../../netlify/functions/api.mjs');
  assert.equal(walletAuthStatus().configured, false);
  assert.throws(() => createWalletChallenge('8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg'), /not configured/);
  process.env.WALLET_AUTH_SECRET = 'isolated-test-only-secret-with-at-least-32-characters';
  assert.equal(walletAuthStatus().mode, 'configured-secret');
  assert.ok(createWalletChallenge('8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg').challengeToken);
  delete process.env.WALLET_AUTH_SECRET;
});
