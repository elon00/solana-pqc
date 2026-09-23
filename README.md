# SCSTOBCMinority AI

**Testnet-first Solana research prototype for wallet infrastructure, post-quantum cryptography experiments, AI-assisted chain tooling, and an uncapped application-level SPQC token model.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Network](https://img.shields.io/badge/Solana-Testnet-blue)](https://explorer.solana.com/?cluster=testnet)
[![Status](https://img.shields.io/badge/status-research%20prototype-orange)](./TESTNET_DEPLOYMENT.md)

> This repository is **not production-ready, independently audited, or verified on Mainnet**. Testnet program deployment evidence is still pending until `TESTNET_DEPLOYMENT.md` and the machine-readable deployment files record real on-chain program IDs, mint address, PDAs, and transaction signatures.

## Project links

- Repository: https://github.com/elon00/scstobcminority-ai
- Netlify full-stack deployment target: https://scstobcminority-ai.netlify.app
- GitHub Pages mirror: https://elon00.github.io/scstobcminority-ai/
- Network target: Solana Testnet
- Reality scorecard: [reality/REALITY_SCORECARD.json](./reality/REALITY_SCORECARD.json)
- Testnet evidence: [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md)

For runtime backend status, use the deployed app's `/health` and `/api/status` endpoints. Repository configuration alone is not proof that an external hosting provider is currently healthy.

## Reality snapshot

### Implemented in source

- Anchor-based custody and SPQC token programs
- React/Vite Testnet dApp
- Phantom and Solflare wallet adapters
- client-side wallet signing
- Ed25519 `signMessage` wallet-to-backend authentication
- authenticated backend wallet session
- Solana Testnet RPC health, wallet, transaction, and program queries
- AI agent intent router
- OpenAI-compatible, Anthropic, Gemini, and deterministic local provider routing
- Netlify Functions backend adapter
- GitHub Pages frontend deployment
- Solana Pay-style receive QR generation/parsing
- QR image decoding
- wallet-signed native Testnet SOL transfers
- backend transaction-status verification
- TypeScript and Rust PQC research SDKs
- branding/reality CI gates

### Not yet established

- verified on-chain Testnet deployment of the custom Anchor programs
- verified SPQC mint address
- verified custody/token initialization transaction signatures
- cryptographic PQC signature verification inside the Solana programs
- independent smart-contract audit
- independent cryptographic implementation audit
- penetration testing, fuzzing, or formal verification
- production treasury/governance controls
- Mainnet readiness
- regulatory certification or universal legal compliance

## Send and receive semantics

### Receive

The dApp can generate a Solana Pay-style QR for the connected Testnet wallet, optionally including a SOL amount and message.

Generating a receive QR **does not create a blockchain transaction or transaction hash**. A transaction signature is created only when a sender signs and submits a payment.

### Send

The QR payment panel parses and validates a Solana payment request, then creates a native SOL transfer using Solana's **System Program**. The connected wallet signs the transaction client-side.

A successful Testnet send produces a Solana **transaction signature**. That signature is different from:

- a custom smart-contract program ID;
- a program deployment signature;
- an SPQC mint address;
- a custody/token initialization signature.

SPQC QR transfers are intentionally disabled until the SPQC mint is verified on Testnet.

## Smart-contract reality

### SPQC token program

Current application model:

- symbol: `SPQC`
- decimals: `9`
- application-level supply policy: uncapped
- raw SPL Token accounting: bounded by `u64`
- minting controlled by the configured mint authority
- checked supply arithmetic
- token/mint relationship constraints

The instruction named `transfer_quantum_safe` **does not cryptographically verify PQC signatures on-chain**. Attached PQC bytes are prototype evidence only, and the emitted event explicitly records that PQC was not verified on-chain.

### Custody program

The custody program validates algorithm selection, public-key sizes, signature sizes, owner authorization, message size, and key-rotation timing.

It does **not** currently perform full cryptographic PQC signature verification on-chain. Selecting an algorithm no longer self-certifies a vault as FIPS-compliant or audited.

## Post-quantum cryptography status

The repository includes TypeScript/Rust research integrations targeting NIST-standardized PQC families, including ML-KEM and ML-DSA-family operations.

Local automated tests are useful engineering evidence, but they are **not an independent security audit, FIPS validation certificate, or proof that the full dApp is quantum-safe end-to-end**.

Legacy self-generated "URS 10/10" artifacts are deprecated. The current evidence-based scorecard is the authoritative internal reality report.

## SPQC token policy

SPQC is a research/community-utility token prototype.

- supply cap: none at the application layer
- raw accounting limit: Solana SPL Token `u64`
- mint authority: authority-controlled
- no guaranteed price, return, yield, aid, job, housing, health outcome, political influence, religious status, or other personal outcome

See [docs/TOKENOMICS.md](./docs/TOKENOMICS.md).

## Core purpose

SCSTOBCMinority AI includes a human-development mission focused on dignity, opportunity, education, health, livelihood, technology access, research, and accountable community programs for SC, ST, OBC, minority, and other underserved communities.

Programs must remain lawful, voluntary, rights-respecting, and non-coercive. Benefits must not be conditioned on voting behavior, party allegiance, religious conversion, or personal relationships.

See:

- [CORE_PURPOSE.md](./CORE_PURPOSE.md)
- [WHITEPAPER.md](./WHITEPAPER.md)

## Architecture

```text
Phantom / Solflare
       |
       | wallet connect + signMessage + transaction signing
       v
React / Vite frontend
       |
       | HTTPS JSON API
       v
Node / Netlify Functions backend
       |
       | Solana JSON-RPC
       v
Solana Testnet
```

External AI providers remain server-side. Private wallet keys and seed phrases must never be sent to the backend or AI providers.

## Development

### Pinned project expectations

- Node.js 20 for CI/backend/frontend
- Anchor CLI 0.29.0
- Solana CLI 1.17.0 in the deployment container
- Rust 2021 workspace with a conservative `rust-version = 1.68` for Solana SBF compatibility
- modern stable Rust may be used for host-side workspace checks

Prefer the repository CI/container configuration over ad-hoc toolchain upgrades.

### Install and verify

```bash
git clone https://github.com/elon00/scstobcminority-ai.git
cd scstobcminority-ai

npm install
npm run branding:check
npm run test:nist
npm run audit:crypto
npm run reality:audit

cargo check --workspace
cargo test --workspace

cd backend
npm ci
npm run check
npm test

cd ../app
npm ci
npm run build
```

### Build Anchor programs

```bash
anchor build
```

### Testnet initialization

Only after a funded Testnet deployer and successful program deployment:

```bash
export ANCHOR_PROVIDER_URL=https://api.testnet.solana.com
node scripts/initialize-testnet.mjs
```

### Mainnet

Mainnet commands are intentionally disabled in the root package scripts until Testnet evidence and release gates are complete.

## Environment safety

Never commit or paste:

- wallet seed phrases;
- wallet private keys;
- production API keys;
- deployer keypairs;
- `WALLET_AUTH_SECRET`.

For GitHub Actions deployment, use a dedicated **Testnet-only** funded signer secret. Do not reuse a personal wallet secret.

## Documentation

- [Project Summary](./PROJECT_SUMMARY.md)
- [Core Purpose](./CORE_PURPOSE.md)
- [Whitepaper](./WHITEPAPER.md)
- [Tokenomics](./docs/TOKENOMICS.md)
- [Security Policy](./SECURITY.md)
- [Security Reality Review](./SECURITY_AUDIT.md)
- [Testnet Blueprint](./TESTNET_BLUEPRINT.md)
- [Testnet Deployment Evidence](./TESTNET_DEPLOYMENT.md)
- [Reality Audit](./docs/reality/REALITY_AUDIT.md)
- [Reality Scorecard](./reality/REALITY_SCORECARD.json)

## Current release gates

| Gate | Status |
|---|---|
| Frontend CI | Implemented / CI-checked |
| Backend CI | Implemented / CI-checked |
| Rust workspace CI | Implemented / CI-checked |
| Branding guard | Implemented |
| Wallet-to-backend authentication | Implemented |
| QR receive / native SOL send | Implemented in source |
| Payment boundary tests | Implemented |
| Anchor/SBF build | Previously passed in Testnet deployment workflow |
| Funded Testnet deployer | Required |
| Custom programs verified on Testnet | **Pending** |
| SPQC mint verified | **Pending** |
| Initialization signatures recorded | **Pending** |
| Independent security audit | **Pending** |
| Mainnet | **Disabled** |

## Security

Read [SECURITY.md](./SECURITY.md) before testing.

There is currently no funded bug-bounty program, no 24/7 security-response commitment, and no independent professional audit recorded in this repository.

## License

MIT — see [LICENSE](./LICENSE).

---

**Canonical project name:** SCSTOBCMinority AI  
**Current network target:** Solana Testnet  
**Current status:** research prototype / not Mainnet-ready
