#!/usr/bin/env bash
set -euo pipefail

echo "SCSTOBCMinority AI — deployment guidance"
echo "Frontend + backend are configured for Netlify via netlify.toml."
echo "GitHub Pages is a static mirror and points its backend calls to the Netlify origin."
echo
echo "This script intentionally does NOT deploy Solana programs or Mainnet assets."
echo "For Solana Testnet deployment use:"
echo "  - GitHub Actions: Deploy SCSTOBCMinority AI to Solana Testnet"
echo "  - or scripts/deploy-all.sh testnet"
echo
echo "For local full-stack validation:"
echo "  npm run testnet:stack"
