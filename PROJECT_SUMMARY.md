# SCSTOBCMinority AI — Project Summary

## Current Status

**Stage:** Research prototype / Devnet-oriented development  
**Repository:** https://github.com/elon00/scstobcminority-ai  
**Web app:** https://elon00.github.io/scstobcminority-ai/  
**Token:** SPQC  
**Supply model:** Uncapped at the application layer; SPL Token raw supply remains bounded by Solana's `u64` accounting.

The repository contains substantive Solana, Rust, TypeScript, React and post-quantum-cryptography research components, but it should not be represented as independently audited, fully production-ready, legally compliant in every jurisdiction, or guaranteed to deliver financial returns.

---

## Core Mission

SCSTOBCMinority AI combines quantum-safe blockchain research with a human-development mission focused on dignity, opportunity and upliftment for **SC, ST, OBC, minority and other underserved communities**.

Guiding values:

**Love · Peace · Joy · Harmony · Truth · Charity · Unity · Equality · Dignity · Liberty · Consent · Knowledge · Service · Justice**

Potential future community programs include education, scholarships, health, nutrition, housing support, jobs, livelihoods, entrepreneurship, financial literacy, productive assets, technology access, scientific learning, charitable grants, agriculture, community infrastructure and other lawful human-development initiatives.

See:

- [Core Purpose](./CORE_PURPOSE.md)
- [White Paper](./WHITEPAPER.md)
- [Tokenomics](./docs/TOKENOMICS.md)

---

## Technology Present in the Repository

### Solana / Rust

- Anchor-based Solana programs
- Quantum custody program
- SCSTOBCMinority AI token program
- SPL Token integration
- PDA-based account patterns
- Devnet deployment automation

### Post-Quantum Cryptography Research

Repository code and evidence tooling cover research around:

- ML-KEM / Kyber-family tooling
- ML-DSA / Dilithium-family tooling
- SLH-DSA / SPHINCS+-family tooling
- hybrid Ed25519 + PQC concepts

Independent cryptographic review is still required before production-security claims.

### SDKs

- TypeScript SDK
- Rust SDK
- Solana client and vault utilities
- crypto-related utilities and tests

### Web Application

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Phantom wallet adapter
- Solflare wallet adapter
- GitHub Pages deployment

### CI/CD

- GitHub Actions
- frontend build checks
- Rust checks/tests
- Devnet deployment workflow
- GitHub Pages workflow

---

## SPQC Token

### Current Technical Model

- Symbol: **SPQC**
- Decimals: **9**
- Supply policy: **uncapped at the application layer**
- Authority-controlled minting
- Current token paths: initialize, mint, burn, transfer
- SPL Token raw accounting ceiling: `u64`

### Intended Future Utility

Subject to implementation, governance and legal review, SPQC may support:

- community grants;
- scholarships;
- education and skills programs;
- health and nutrition programs;
- housing support;
- livelihoods and entrepreneurship;
- technology and productive assets;
- open-source and scientific research;
- accountable community treasuries.

The token must not be used to buy public votes, condition aid on political or religious allegiance, coerce relationships, or promise guaranteed personal or investment outcomes.

---

## Implemented vs Planned

### Implemented / Present

- Solana Anchor programs
- SPL Token integration
- uncapped application-level mint model
- Rust SDK
- TypeScript SDK
- PQC research code
- React/Vite web app
- Phantom/Solflare provider support
- GitHub CI/CD
- GitHub Pages

### Prototype / Requires Validation

- end-to-end PQC security
- hybrid cryptographic guarantees
- production deployment hardening
- token economic controls
- community treasury architecture

### Implemented Application Integration

- Testnet Node backend API
- AI agent intent routing with live chain grounding
- multi-model provider router (OpenAI-compatible / Anthropic / Gemini when credentials are configured)
- deterministic local safe fallback model
- wallet/account/transaction/program verification endpoints
- Ed25519 wallet ownership verification through signMessage
- short-lived backend wallet sessions
- frontend ↔ backend wallet state synchronization
- one-click Docker Compose Testnet stack

### Planned / Not Yet Complete

- simultaneous multi-wallet orchestration
- staking and yield systems
- cross-chain bridges
- formal community governance
- Conway automaton integration
- broader Web4 architecture
- large-scale beneficiary-distribution systems
- independent security audit

---

## Safety and Rights Principles

- Human dignity is not token-weighted.
- Public political rights cannot be bought with SPQC.
- Assistance cannot be conditioned on party support or voting behavior.
- Religious or spiritual participation must remain voluntary.
- Marriage and relationships require lawful adult consent; people can never be tokenized or allocated.
- Sensitive beneficiary information should not be written publicly on-chain.
- No guaranteed wealth, job, housing, land, precious metals, health outcome, relationship, blessing or supernatural result is promised.

---

## Immediate Technical Priorities

1. Verify Devnet deployment state and publish real on-chain program IDs/signatures.
2. Keep CI green and reproducible.
3. Complete independent smart-contract and cryptographic review.
4. Add treasury/mint-authority safeguards before any significant issuance.
5. Build measurable community-program pilots with qualified partners.
6. Add AI or governance modules only when code, tests and safeguards exist.
7. Keep documentation synchronized with actual implementation.

---

**Version:** 2.0  
**Last updated:** September 23, 2026
