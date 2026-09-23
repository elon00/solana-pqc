# 🚀 Deployment Guide for Your Wallet

**Your Wallet**: 8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg

## Quick Deploy (3 Steps)

### Step 1: Install Solana CLI (if not installed)

```powershell
# Download and install from:
# https://docs.solana.com/cli/install-solana-cli-tools

# Or use this command:
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Step 2: Configure Your Wallet

```powershell
# Set to testnet
solana config set --url testnet

# Set your wallet (you'll need your keypair file)
solana config set --keypair <path-to-your-keypair.json>

# Check balance
solana balance

# If low, request airdrop
solana airdrop 2
```

### Step 3: Deploy

```powershell
cd scstobcminority-ai

# Install dependencies
npm install

# Build programs
anchor build

# Deploy to testnet
anchor deploy --provider.cluster testnet
```

## 📋 What Will Happen

After deployment, you'll see:

```
Deploying workspace: https://api.testnet.solana.com
Upgrade authority: 8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg
Deploying program "quantum_custody"...
Program Id: QCust... 

Deploying program "scstobcminority_ai_token"...
Program Id: SPQC...

Deploy success
```

## 🔗 After Deployment

1. **Copy the Program IDs** from the output
2. **Update .env file** with the new IDs
3. **View on Explorer**: 
   - https://explorer.solana.com/address/[PROGRAM_ID]?cluster=testnet

## ⚠️ Important Notes

- **Costs**: ~2-5 SOL for deployment (testnet is free)
- **Time**: Takes 2-5 minutes
- **Network**: Make sure you're on testnet first
- **Backup**: Save the program IDs

## 🆘 Troubleshooting

**Error: Insufficient funds**
```powershell
solana airdrop 5
```

**Error: Anchor not found**
```powershell
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

**Error: Build failed**
```powershell
# Make sure Rust is installed
rustup update
cargo --version
```

---

**Need Help?** Run these commands and share any errors you see.
