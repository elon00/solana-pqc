# SCSTOBCMinority AI — Solana Testnet Deployment

**Status:** Final clean evidence-gated Testnet deployment triggered after green backend, frontend and Rust CI on September 23, 2026. Mainnet remains intentionally deferred.

**Network:** Solana Testnet  
**RPC:** https://api.testnet.solana.com

## Verification gates

The deployment is considered complete only after all of these succeed:

- Anchor/SBF build
- Quantum Custody program deploy
- SCSTOBCMinority AI token program deploy
- uncapped SPQC mint initialization
- custody initialization
- upgrade-authority transfer
- executable program-account verification
- mint account verification
- initialization transaction-signature capture
- synchronized machine-readable deployment config
- frontend/backend CI and Pages redeploy

## Supply policy

SPQC uses uncapped application-level minting. SPL Token raw supply remains technically bounded by Solana's `u64` accounting.

## Mainnet lock

Mainnet deployment is intentionally disabled until Testnet deployment, end-to-end verification and security-readiness review succeed.

Final program IDs, SPQC mint address, PDAs and initialization transaction signatures will be written here automatically only after verified on-chain success.
