#!/usr/bin/env node

console.error([
  "scripts/deploy-solana.js is deprecated.",
  "Use the evidence-gated Testnet workflow or scripts/deploy-all.sh testnet.",
  "Mainnet deployment remains disabled until Testnet evidence and security release gates pass."
].join("\n"));
process.exit(1);
