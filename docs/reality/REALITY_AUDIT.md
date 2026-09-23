# SCSTOBCMinority AI — Reality Audit

**Audit date:** September 23, 2026  
**Method:** repository evidence, source review, CI/deployment records, and claim-to-code reconciliation  
**Type:** internal engineering reality audit; not an independent security certification

## Current grades

| Dimension | Score | Grade |
|---|---:|:---:|
| Engineering implementation | **87/100** | **B+** |
| Release assurance | **12/100** | **F** |
| Overall reality score | **68/100** | **D+** |

The overall grade is intentionally conservative. Strong frontend/backend/CI work does not compensate for missing on-chain deployment evidence or independent security assurance.

## What is working in source

- canonical SCSTOBCMinority AI branding with CI guard;
- Testnet React/Vite dApp;
- Phantom/Solflare wallet adapters;
- wallet-local transaction signing;
- wallet-to-backend Ed25519 message authentication;
- authenticated backend wallet sessions;
- Node backend and Netlify Functions adapter;
- Testnet RPC health/wallet/transaction/program queries;
- AI intent router and optional multi-model provider adapters;
- deterministic local AI fallback;
- receive QR generation;
- QR image decoding and Solana payment-request parsing;
- wallet-signed native Testnet SOL send flow;
- backend transaction verification endpoint;
- backend payment boundary tests;
- Rust workspace checks/tests;
- Anchor programs and Testnet deployment pipeline;
- checked token supply arithmetic and strengthened mint/account constraints.

## What is not proven

### Custom smart contracts are not yet verified on Testnet

The authoritative deployment JSON remains `pending`.

No verified evidence is currently recorded for:

- custody program account;
- token program account;
- Quantum Custody program deployment transaction signature;
- Token Program deployment transaction signature;
- SPQC mint;
- custody global-state PDA;
- TokenInfo PDA;
- custody initialization signature;
- token initialization signature.

Therefore, no custom smart-contract deployment hash/signature should be claimed as complete yet.

### Native SOL send/receive is separate

The dApp's new send flow creates a native SOL transaction through Solana's System Program. After a user signs and the transaction is submitted, Solana returns a transaction signature.

Generating a receive QR alone produces **no blockchain hash**.

### PQC is not verified on-chain

The repository contains PQC research/library integrations, but the custom programs do not currently perform full cryptographic PQC signature verification on-chain.

Audit hardening changed the code to fail closed rather than self-certify:

- token `is_quantum_secured` initializes false;
- the custom quantum-safe token transfer is disabled until verification exists;
- events state `quantum_verified_on_chain: false`;
- vault creation no longer marks itself FIPS-compliant/audited;
- KEM-only algorithms are blocked from signature-only custody operations;
- custody `sign_transaction` fails closed until cryptographic PQC verification exists.

## Security reality

No independent evidence is recorded for:

- professional smart-contract audit;
- independent cryptographic review;
- penetration test;
- fuzzing campaign;
- formal verification;
- funded bug bounty;
- production incident-response SLA.

See [../../SECURITY_AUDIT.md](../../SECURITY_AUDIT.md).

## Documentation reality corrections completed

- removed unsupported bounty/reward promises;
- removed fake audit/compliance guarantees;
- removed inflated self-issued 10/10 URS authority;
- corrected Devnet-oriented summary to Testnet-first;
- corrected Quick Start and Testnet initializer;
- removed broken documentation links from README;
- distinguished native SOL transaction signatures from custom program deployment evidence;
- locked Mainnet root commands until release gates are complete.

## Current release blockers

1. funded dedicated Testnet-only deployer;
2. verified on-chain custom program deployment;
3. program deployment signatures plus SPQC mint/PDA/init-signature evidence;
4. independent smart-contract review;
5. independent cryptographic review;
6. on-chain PQC verification design if quantum-safe on-chain claims are desired.

## Grade upgrade path

The score is designed to improve only when evidence improves:

- completing verified Testnet deployment materially raises release assurance;
- independent audits materially raise security assurance;
- genuine on-chain PQC verification materially raises the smart-contract/PQC score.

A cosmetic documentation change alone cannot produce an A grade.

## Authoritative evidence files

- [../../README.md](../../README.md)
- [../../TESTNET_DEPLOYMENT.md](../../TESTNET_DEPLOYMENT.md)
- [../../backend/testnet-deployment.json](../../backend/testnet-deployment.json)
- [../../SECURITY.md](../../SECURITY.md)
- [../../SECURITY_AUDIT.md](../../SECURITY_AUDIT.md)
- [../../REALITY_MANIFEST.json](../../REALITY_MANIFEST.json)
- [../../reality/REALITY_SCORECARD.json](../../reality/REALITY_SCORECARD.json)

**Verdict:** solid Testnet research engineering, but not yet independently assured or Mainnet-ready.
