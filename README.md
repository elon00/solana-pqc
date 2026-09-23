# 🛡️ SCSTOBCMinority AI: Quantum-Safe Custody & Transaction Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-14F195?style=flat&logo=solana&logoColor=white)](https://solana.com)
[![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NIST PQC](https://img.shields.io/badge/NIST%20PQC-Research%20Target-lightgrey)](https://csrc.nist.gov/projects/post-quantum-cryptography)
[![ISO 20022](https://img.shields.io/badge/ISO%2020022-Design%20Reference-lightgrey)](https://www.iso20022.org/)
[![MiCA](https://img.shields.io/badge/MiCA-Legal%20Review%20Required-lightgrey)](https://www.esma.europa.eu/)

> **Research and prototype project for quantum-resistant custody concepts on Solana. Claims of implemented FIPS algorithms, production security, and regulatory compliance require independent cryptographic, deployment, and legal verification.**

## 🔗 Project Links

- **Web App**: https://elon00.github.io/scstobcminority-ai/
- **GitHub Repository**: https://github.com/elon00/scstobcminority-ai
- **Network Target**: Solana Testnet
- **Token Policy**: Uncapped application-level minting; SPL Token raw supply remains bounded by Solana's `u64` counter.
- **Full-stack Testnet Blueprint**: [TESTNET_BLUEPRINT.md](./TESTNET_BLUEPRINT.md)
- **Testnet Deployment Evidence**: [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md)


---

## ❤️ Core Purpose

SCSTOBCMinority AI combines quantum-safe Solana research with a human-development mission focused on the dignity, empowerment and upliftment of **SC, ST, OBC, minority and other underserved communities**.

Its guiding values are **love, peace, joy, harmony, truth, charity, unity, equality, dignity, liberty, consent, knowledge, service and justice**.

The intended long-term use of SPQC is to support transparent, lawful community programs such as scholarships, education, health and nutrition support, housing assistance, jobs and livelihood programs, entrepreneurship, technology access, scientific learning, charitable grants, productive assets and accountable community treasuries.

The token does **not** guarantee wealth, jobs, housing, land, health outcomes, precious metals, marriage, political influence, religious status or supernatural knowledge. Aid must not be conditioned on political allegiance, religious conversion or personal relationships.

See **[CORE_PURPOSE.md](./CORE_PURPOSE.md)** and **[WHITEPAPER.md](./WHITEPAPER.md)** for the complete mission, safeguards and technical model.

---

## 🌟 Overview

SCSTOBCMinority AI protects digital assets against quantum computing threats through:

- **Research target: NIST FIPS 203** (ML-KEM) - implementation requires cryptographic test evidence
- **Research target: NIST FIPS 204** (ML-DSA) - implementation requires cryptographic test evidence
- **Research target: NIST FIPS 205** (SLH-DSA) - implementation requires cryptographic test evidence
- **ISO 20022** - design/reference area; implementation and certification require separate validation
- **MiCA legal review required** - this repository is not a compliance certificate
- **FATF Travel Rule** - compliance consideration; no compliance certification is claimed
- **Cross-chain bridge** - roadmap concept; not represented as production-ready

### 🪙 SPQC Token

**Supply Policy**: Uncapped minting (no application-level fixed supply cap)  
**Technical Limit**: Solana SPL Token uses a `u64` raw supply counter  
**Symbol**: SPQC  
**Decimals**: 9  
**Standard**: SPL Token with Quantum-Safe Extensions

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required software
- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.29+
- Node.js 18+
```

### Installation

```bash
# Clone the repository
git clone https://github.com/elon00/scstobcminority-ai.git
cd scstobcminority-ai

# Install dependencies
npm install

# Build Solana programs
anchor build

# Run tests
anchor test

# Deploy to Testnet after configuring a funded Testnet signer
anchor deploy --provider.cluster testnet

# Initialize programs
ANCHOR_PROVIDER_URL=https://api.testnet.solana.com node scripts/initialize-devnet.mjs

# Start dApp
cd app && npm run dev
```

---

## 📚 Documentation

- **[📄 Whitepaper](./WHITEPAPER.md)** - Complete technical documentation
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - System design and components
- **[📖 API Reference](./docs/API_REFERENCE.md)** - Developer APIs
- **[💰 Tokenomics](./docs/TOKENOMICS.md)** - Token distribution and economics
- **[🌐 Token Standards](./docs/TOKEN_STANDARDS.md)** - Global compliance
- **[✅ Compliance](./docs/COMPLIANCE.md)** - Regulatory framework
- **[🚀 Deployment](./docs/DEPLOYMENT.md)** - Deployment guide
- **[🔒 Security](./docs/SECURITY.md)** - Security best practices

---

## 💻 Usage Examples

### Rust SDK

```rust
use scstobcminority_ai_sdk::{QuantumVault, Algorithm};

// Create quantum-safe vault
let vault = QuantumVault::new(
    owner_pubkey,
    Algorithm::Dilithium3,
    &keypair
)?;

// Sign transaction
let signature = vault.sign_transaction(&transaction, &keypair)?;

// Verify signature
let valid = vault.verify_signature(&transaction, &signature)?;
```

### TypeScript SDK

```typescript
import { QuantumVaultClient, Algorithm } from '@scstobcminority-ai/sdk';

// Initialize client
const client = new QuantumVaultClient(connection, wallet, programId, idl);

// Create vault
const vault = await client.createVault({
  algorithm: Algorithm.DILITHIUM3
}, publicKey);

// Sign transaction
const signature = await client.signTransaction(vaultAddress, message, sig);

// Check quantum readiness
const score = await client.getQuantumReadiness(vaultAddress);
console.log(`Quantum Readiness: ${score}%`);
```

---

## 🤖 Testnet Application Integration

Implemented in the repository:

- **Frontend wallet layer:** Phantom + Solflare adapters on Solana Testnet
- **Backend wallet layer:** public account/balance/transaction/program verification
- **Wallet ownership auth:** Ed25519 `signMessage` challenge verification with short-lived backend sessions
- **AI agentic layer:** intent routing grounded in live Testnet chain state
- **Multi-model router:** OpenAI-compatible, Anthropic and Gemini adapters when server-side credentials are configured
- **Local fallback:** deterministic safe backend agent when external providers are not configured
- **Bidirectional evidence:** frontend → wallet → backend → chain and chain → backend → frontend
- **One-click local stack:** `npm run testnet:stack`
- **One-click GitHub pipeline:** `One-Click Full Stack Testnet`

External model providers are not represented as online unless their server-side credentials and model names are actually configured.

## 🌐 Standards & Compliance Position

The project may reference standards and regulatory frameworks for design research, but **does not claim certification or automatic legal compliance**.

- **NIST FIPS 203/204/205:** cryptographic research targets; independent end-to-end review required
- **ISO 20022:** design/reference area, not a certification claim
- **MiCA / securities laws / MAS / FINMA:** jurisdiction-specific legal review required
- **FATF / AML / sanctions controls:** future compliance-design areas where applicable
- **GDPR / CCPA:** privacy-design considerations; sensitive beneficiary data should not be placed openly on-chain
- **Cross-chain bridges:** roadmap concepts, not production-ready features

---

## 📊 Token Distribution

| Category | Allocation | Tokens | Vesting |
|----------|-----------|--------|---------|
| Public Sale | 30% | Emission-based | None |
| Ecosystem | 25% | Emission-based | 4 years |
| Team | 15% | Emission-based | 4 years, 1yr cliff |
| Partners | 10% | Emission-based | 2 years |
| Liquidity | 10% | Emission-based | Immediate |
| Community | 5% | Emission-based | 3 years |
| Reserve | 5% | Emission-based | Governance |

---

## 🔐 Security

### Audits
- [ ] Independent smart-contract audit
- [ ] Independent cryptographic implementation review
- [ ] Full-stack security review
- [ ] Governance/economic review before production use

### Bug Bounty
- **Pool**: $1,000,000 SPQC
- **Scope**: Smart contracts, cryptography, infrastructure
- **Rewards**: Up to $100,000 for critical vulnerabilities

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🌍 Community

- **Website**: https://elon00.github.io/scstobcminority-ai/
- **Documentation**: https://github.com/elon00/scstobcminority-ai
- **Twitter**: Not configured
- **Discord**: Not configured
- **Email**: Not configured

---

## 🗺️ Roadmap

### Current Testnet phase
- [x] Core Solana/Anchor programs
- [x] PQC research SDKs and evidence tooling
- [x] Uncapped application-level SPQC token model
- [x] Testnet frontend wallet integration
- [x] Testnet backend API and wallet verification
- [x] Agentic multi-model routing layer
- [x] CI/CD and one-click Testnet blueprint
- [ ] Verified on-chain Testnet program deployment
- [ ] Independent security review

### Mainnet release gate
- [ ] Testnet programs verified executable
- [ ] SPQC mint + initialization signatures recorded
- [ ] Public backend health verified
- [ ] Security/readiness review completed
- [ ] Mainnet deployment explicitly approved

---

## ⚠️ Disclaimer

This software is provided for research and development purposes. While it implements NIST-standardized post-quantum algorithms, it should undergo thorough security audits before production use with real assets.

---

**Built with ❤️ for a quantum-safe future**

[![Star on GitHub](https://img.shields.io/github/stars/elon00/scstobcminority-ai?style=social)](https://github.com/elon00/scstobcminority-ai)
