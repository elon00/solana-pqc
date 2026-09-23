# SCSTOBCMinority AI — Security Reality Review

**Date:** September 23, 2026  
**Scope:** repository source review and automated CI evidence  
**Status:** internal engineering review; **not an independent professional audit**

## Executive summary

SCSTOBCMinority AI is a Testnet-first research prototype. The repository has useful security controls and green CI evidence, but it is **not Mainnet-ready** and must not be represented as independently audited or fully quantum-safe end-to-end.

The most important release blockers are:

1. custom Anchor programs are not yet recorded as verified on Solana Testnet;
2. SPQC mint and initialization transaction signatures are not recorded;
3. custody/token programs do not perform full cryptographic PQC signature verification on-chain;
4. no independent smart-contract or cryptographic audit is recorded;
5. fuzzing, formal verification, and independent penetration testing are pending.

## Evidence reviewed

- Anchor custody and token programs
- Rust workspace configuration
- TypeScript/Rust PQC research SDKs
- React/Vite wallet application
- Node backend and Netlify Functions adapter
- wallet authentication flow
- Solana Pay QR/payment module
- GitHub Actions CI and Pages workflows
- Testnet deployment workflow and machine deployment records
- security, README, manifest, and reality artifacts

## Findings

### HIGH — On-chain PQC verification is not implemented

The custody `sign_transaction` and `rotate_keys` paths validate authorization, algorithm compatibility, signature length, and other structural constraints, but they do not cryptographically verify the PQC signature on-chain.

The token instruction historically named `transfer_quantum_safe` also does not verify attached PQC evidence on-chain.

**Mitigation applied in this audit:**

- token initialization now sets `is_quantum_secured = false`;
- the custom quantum-safe transfer path therefore fails closed until real verification exists;
- transfer events explicitly record `quantum_verified_on_chain: false`;
- custody vault creation no longer self-certifies FIPS compliance/readiness;
- KEM-only algorithms are rejected from signature-oriented custody operations.

**Remaining work:** design and independently review a feasible verification architecture before enabling PQC-verified on-chain claims.

### HIGH — Testnet deployment evidence is incomplete

`backend/testnet-deployment.json` and `app/public/testnet-deployment.json` remain in `pending` state.

Missing verified evidence includes:

- custody program account;
- token program account;
- SPQC mint;
- TokenInfo PDA;
- custody global-state PDA;
- custody initialization signature;
- token initialization signature.

The latest known deployment workflow successfully reached Anchor/SBF build but was blocked by lack of funded Testnet SOL for the ephemeral deployer.

**Release impact:** Mainnet remains blocked.

### MEDIUM — Independent security assurance is absent

No evidence is recorded for:

- professional smart-contract audit;
- independent cryptographic implementation review;
- penetration test;
- fuzzing campaign;
- formal verification;
- funded bug-bounty program.

Automated tests are valuable engineering evidence but are not substitutes for independent review.

### MEDIUM — Serverless abuse controls need provider-native hardening

The persistent Node server includes a basic in-memory per-IP rate limiter. Serverless deployments may create multiple isolated instances and should use Netlify/provider-native rate limiting, WAF, bot controls, or equivalent controls for production exposure.

### MEDIUM — Authority and governance design requires review

SPQC minting is authority-controlled and intentionally uncapped at the application layer. Before real-value use, review:

- mint authority custody;
- program upgrade authority;
- treasury governance;
- emergency controls;
- multisig/threshold policy;
- monitoring and incident response.

### LOW — Documentation historically overstated assurance

Older repository artifacts claimed or implied:

- 10/10 reality certification;
- global compliance;
- audit/bounty commitments;
- automatic FIPS compliance/readiness.

This audit deprecates those artifacts and replaces them with evidence-based status documents and scorecards.

## Positive controls verified in source

- wallet seed phrases/private keys are not required by the backend;
- wallet ownership authentication uses Ed25519 `signMessage`;
- backend wallet sessions are stateless and time-limited;
- transaction signing remains in Phantom/Solflare;
- Testnet RPC is the canonical chain target;
- Mainnet root scripts are disabled;
- payment requests validate recipient and amount;
- SPL-token QR transfers are blocked until the SPQC mint is verified;
- token supply arithmetic uses checked operations;
- token mint/destination relationships are constrained;
- KEM algorithms are blocked from signature-only custody operations;
- branding/reality CI gates exist.

## Testing status

### Automated checks present

- frontend TypeScript/Vite build
- backend syntax checks
- backend unit tests
- wallet-auth Ed25519 round-trip test
- payment request validation tests
- Rust workspace `cargo check` and `cargo test`
- branding guard
- reality audit/scorecard
- Anchor/SBF build in the Testnet deployment workflow

### Still needed

- end-to-end wallet payment browser tests
- Anchor instruction integration tests against a local validator/Testnet fixture
- negative authorization tests for every program instruction
- property/fuzz tests for account/state transitions
- load/abuse tests for public backend
- external security review

## Compliance position

This repository is **not** a compliance certificate.

References to NIST, ISO 20022, MiCA, FATF, GDPR, securities laws, or other frameworks are research/design considerations only unless independently established by qualified reviewers for the actual deployment and jurisdiction.

## Current risk conclusion

- **Research/Testnet use:** acceptable for controlled experimentation with non-real-value assets, subject to the limitations above.
- **Production/Mainnet use:** not approved by repository evidence.
- **Real-value custody:** not recommended until independent review and release gates are complete.

See:

- [SECURITY.md](./SECURITY.md)
- [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md)
- [docs/reality/REALITY_AUDIT.md](./docs/reality/REALITY_AUDIT.md)
- [reality/REALITY_SCORECARD.json](./reality/REALITY_SCORECARD.json)

**This document is an internal engineering review, not a third-party audit.**
