# SCSTOBCMinority AI — Solana Testnet Deployment

## Preferred path

Use the GitHub Actions workflow **Deploy SCSTOBCMinority AI to Solana Testnet**.

The workflow builds first, checks funding, deploys both programs, initializes custody/SPQC, transfers upgrade authority, verifies on-chain accounts, and writes deployment evidence.

## Funding requirement

A Solana program deployment requires Testnet SOL.

The public Testnet faucet can be rate-limited. For reproducibility, use a dedicated Testnet-only deployer and store its encoded keypair only as a protected GitHub Actions secret. Do not use or paste a personal wallet seed phrase/private key.

## Local manual path

```bash
solana config set --url https://api.testnet.solana.com
solana balance

anchor build
anchor keys sync
anchor build
anchor deploy --provider.cluster testnet

ANCHOR_PROVIDER_URL=https://api.testnet.solana.com \
  node scripts/initialize-testnet.mjs
```

Or use:

```bash
./scripts/deploy-all.sh testnet
```

## Verification

Do not treat command completion as final evidence. Verify:

- custody program account exists and is executable;
- token program account exists and is executable;
- SPQC mint account exists;
- custody and TokenInfo PDAs are correct;
- initialization transaction signatures exist and confirm;
- authority transfers are correct.

The workflow records these only after successful verification.

## Current status

See [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md).

If it says pending, no verified custom smart-contract deployment hash/signature should be claimed.

## Mainnet

Mainnet is explicitly out of scope until Testnet evidence and security release gates are complete.
