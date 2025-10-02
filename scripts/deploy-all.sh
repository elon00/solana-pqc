#!/bin/bash
set -e

echo "🚀 SOLANA-PQC Complete Deployment"
echo "=================================="
echo ""

NETWORK=${1:-devnet}

echo "📋 Configuration:"
echo "   Network: $NETWORK"
echo "   Wallet: 8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg"
echo ""

echo "⚙️  Configuring Solana..."
solana config set --url $NETWORK

echo ""
echo "🔨 Building programs..."
anchor build

echo ""
echo "🌐 Deploying to $NETWORK..."
anchor deploy --provider.cluster $NETWORK

CUSTODY_ID=$(solana address -k target/deploy/quantum_custody-keypair.json)
TOKEN_ID=$(solana address -k target/deploy/solana_pqc_token-keypair.json)

echo ""
echo "✅ Deployed!"
echo "   Quantum Custody: $CUSTODY_ID"
echo "   Token: $TOKEN_ID"
echo ""
echo "🔗 Explorer:"
echo "   https://explorer.solana.com/address/$CUSTODY_ID?cluster=$NETWORK"
echo "   https://explorer.solana.com/address/$TOKEN_ID?cluster=$NETWORK"
