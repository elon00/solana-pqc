# Observed Testnet program — 2026-09-23

A supplied research report named `Bnpd9YGaVxMAwdxFoVA3SQP1Vhfwv7jnJ67QNcyAVKq3` as a deployed project program. Direct JSON-RPC checks against `https://api.testnet.solana.com` established the following:

- `getAccountInfo`, confirmed commitment, slot 444202968: account exists and is executable; owner is `BPFLoaderUpgradeab1e11111111111111111111111`.
- `getSignaturesForAddress`: the transaction below is finalized with no error.
- `getTransaction`: logs and parsed instructions identify a successful **program upgrade**, not a wallet payment or custody operation.
- Upgrade authority in that transaction: `8qhW8ctXX77UNLTY9kx3XoAoH8kstQXPbCghUwqu34es`.
- Program data account: `DhJKKEatbJZCRavF3hiSUGWfLP1K43adh2LLCkGR8CLn`.

Verified upgrade transaction:

`5DKkhtQWdPBZvxUokeoDYnhKuCXEtM2UMa2pgFdCgJyS9VLTTVz9MPCqc368gHMvvBLqtwsy2nbVQJF9dqGqgxDN`

[Program explorer](https://explorer.solana.com/address/Bnpd9YGaVxMAwdxFoVA3SQP1Vhfwv7jnJ67QNcyAVKq3?cluster=testnet)

[Upgrade transaction](https://explorer.solana.com/tx/5DKkhtQWdPBZvxUokeoDYnhKuCXEtM2UMa2pgFdCgJyS9VLTTVz9MPCqc368gHMvvBLqtwsy2nbVQJF9dqGqgxDN?cluster=testnet)

This evidence does not map the deployed binary to this repository's source or either of its Anchor programs. It does not verify an SPQC mint, initialize either PDA, establish end-to-end PQC verification, or demonstrate a custody transaction. The upgrade consumed 2,370 compute units; that number measures the loader upgrade, not a PQC operation, so it must not be presented as a PQC benchmark.

The supplied report's exclusivity, competitor percentages, and claim that the transaction-size limit is solved remain unsupported by the evidence available here. No competitor census or authenticated Copilot research was performed in this session. The report's local Windows file was not accessible.

The repository's deployment record remains pending until both custom programs and their required initialization/mint evidence can be verified. This observation is deliberately separate from that record.
