#!/usr/bin/env bash
set -euo pipefail

echo "SCSTOBCMinority AI — local Solana Testnet deploy helper"

NETWORK="${1:-testnet}"
if [[ "$NETWORK" != "testnet" ]]; then
  echo "Refusing network '$NETWORK'. This helper is Testnet-only; Mainnet is release-gated." >&2
  exit 1
fi

command -v solana >/dev/null || { echo "solana CLI is required" >&2; exit 1; }
command -v anchor >/dev/null || { echo "Anchor CLI 0.29.x is required" >&2; exit 1; }

solana config set --url https://api.testnet.solana.com
echo "Deployer: $(solana address)"
echo "Balance: $(solana balance --url https://api.testnet.solana.com)"

anchor build
anchor keys sync
anchor build
anchor deploy --provider.cluster testnet

CUSTODY_ID="$(solana address -k target/deploy/quantum_custody-keypair.json)"
TOKEN_ID="$(solana address -k target/deploy/scstobcminority_ai_token-keypair.json)"

echo "Quantum Custody program candidate: $CUSTODY_ID"
echo "SPQC token program candidate: $TOKEN_ID"
echo "Verify both accounts on Testnet before claiming deployment success."
echo "Then initialize with: ANCHOR_PROVIDER_URL=https://api.testnet.solana.com node scripts/initialize-testnet.mjs"
