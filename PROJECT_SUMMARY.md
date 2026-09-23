# SCSTOBCMinority AI — Project Summary

## Status

**Stage:** Testnet-first research prototype  
**Repository:** https://github.com/elon00/scstobcminority-ai  
**Netlify target:** https://scstobcminority-ai.netlify.app  
**GitHub Pages mirror:** https://elon00.github.io/scstobcminority-ai/  
**Token:** SPQC  
**Mainnet:** disabled pending Testnet evidence and security review

The repository contains substantive Solana, Rust, TypeScript, React, backend API, wallet-authentication, payment, and post-quantum-cryptography research code. It must not be represented as independently audited, production-ready, universally compliant, or verified on Mainnet.

## Implemented in source

### Solana / smart contracts

- Anchor custody program
- Anchor SPQC token program
- SPL Token integration
- checked supply arithmetic
- authority and mint-account constraints
- PDA-based account patterns
- Testnet deployment workflow

### Wallet / payments

- Phantom and Solflare adapters
- client-side transaction signing
- Ed25519 `signMessage` wallet authentication
- stateless backend wallet sessions
- authenticated wallet status endpoint
- Solana Pay-style receive request generation
- QR image decoding
- native Testnet SOL send flow
- backend transaction-status verification

Native SOL send/receive uses the Solana System Program. It is separate from the custom custody/token program deployment.

### Backend / AI

- Node HTTP backend
- Netlify Functions backend adapter
- Solana Testnet RPC health checks
- wallet/account/transaction/program queries
- AI intent router
- local deterministic fallback
- OpenAI-compatible, Anthropic, and Gemini provider adapters when server-side credentials are configured

### PQC research

- TypeScript and Rust PQC-related SDK code
- ML-KEM / ML-DSA-family integrations
- local cryptographic tests and evidence tooling

These are engineering/research artifacts, not independent certification of end-to-end quantum safety.

## Important limitations

- `TESTNET_DEPLOYMENT.md` is still pending verified on-chain deployment.
- Machine deployment JSON currently contains no verified custom program IDs, SPQC mint, PDAs, or initialization signatures.
- Custody signature paths check sizes/authorization but do not cryptographically verify PQC signatures on-chain.
- The token instruction historically named `transfer_quantum_safe` does not perform PQC verification on-chain; the code now explicitly records that fact.
- Vault algorithm selection no longer self-certifies FIPS compliance/readiness.
- No independent smart-contract audit, cryptographic audit, penetration test, fuzzing campaign, or formal verification is recorded.
- Mainnet release remains disabled.

## SPQC model

- symbol: **SPQC**
- decimals: **9**
- application supply cap: **none**
- raw SPL Token supply accounting: **u64**
- minting: authority-controlled
- no guaranteed financial return, yield, benefit, right, or personal outcome

## Core mission

SCSTOBCMinority AI includes a rights-respecting human-development mission for SC, ST, OBC, minority, and other underserved communities. Intended future programs may include education, health, livelihood, technology access, research, grants, and accountable community infrastructure.

Aid or access must never be conditioned on political allegiance, voting behavior, religious conversion, or coercive personal relationships.

## Release priorities

1. Keep CI, frontend build, backend tests, Rust checks, and reality/branding guards green.
2. Fund a dedicated Testnet-only deployer without exposing personal wallet secrets.
3. Deploy and verify both custom programs on Solana Testnet.
4. Record SPQC mint, PDAs, and initialization transaction signatures.
5. Expand integration/adversarial tests.
6. Complete independent smart-contract and cryptographic review.
7. Review upgrade/mint/treasury authority design.
8. Only then consider Mainnet.

See [docs/reality/REALITY_AUDIT.md](./docs/reality/REALITY_AUDIT.md) and [reality/REALITY_SCORECARD.json](./reality/REALITY_SCORECARD.json).

**Last updated:** September 23, 2026
