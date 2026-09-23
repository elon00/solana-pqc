# SCSTOBCMinority AI — Full-Stack Solana Testnet Blueprint

## Objective

Run the complete project on **Solana Testnet first** with synchronized frontend, backend, wallet integration, AI agentic orchestration, multi-model routing, smart-contract deployment verification, and explicit evidence gates. Mainnet remains disabled until Testnet succeeds and is independently reviewed.

## System Architecture

```
Phantom / Solflare
       |
       | user-controlled signing only
       v
React + Vite Frontend (Testnet)
       |
       | HTTPS JSON API
       v
Node Backend
  |         \
  |          +-- Agent planner
  |          +-- Multi-model router
  |              OpenAI-compatible / Anthropic / Gemini / local fallback
  |
  +-- Solana Testnet RPC
       |-- wallet/account status
       |-- transaction confirmation
       |-- program verification
       |-- chain health
       |
       v
Anchor Programs on Solana Testnet
  |-- Quantum Custody
  +-- SCSTOBCMinority AI / SPQC Token
```

## Security Boundary

### Frontend wallet responsibilities

- discover Phantom and Solflare;
- connect to the user's wallet;
- display the public address and Testnet SOL balance;
- construct transactions;
- request signatures from the wallet;
- send signed transactions to Solana Testnet.

### Backend wallet responsibilities

- read public wallet/account state;
- independently verify balances;
- verify transaction signatures/status;
- verify configured program accounts are executable;
- provide wallet/chain context to the AI agent.

### Backend must never receive

- seed phrases;
- private keys;
- raw secret-key files;
- wallet recovery phrases.

## Testnet Configuration

- Network: Solana Testnet
- RPC: `https://api.testnet.solana.com`
- Frontend: `WalletAdapterNetwork.Testnet`
- Backend: same Testnet RPC by default
- Explorer links: Solana Explorer with `cluster=testnet`
- Mainnet environment: separate inactive template at `.env.mainnet.example`

## Backend API

### `GET /health`

Checks backend process plus Solana Testnet health.

### `GET /api/status`

Returns:

- Testnet RPC status;
- configured on-chain program verification;
- model-provider configuration status;
- wallet signing boundary.

### `GET /api/wallet/:address`

Returns public Testnet wallet/account state and balance.

### `GET /api/tx/:signature`

Checks the same transaction signature independently through the backend Testnet RPC.

### `GET /api/program/:address`

Checks whether an on-chain account exists and is executable.

### `POST /api/auth/challenge`

Creates a short-lived Solana Testnet wallet-authentication message. It never creates a transaction.

### `POST /api/auth/verify`

Verifies the wallet's Ed25519 `signMessage` signature and issues a short-lived backend session token.

### `GET /api/auth/session`

Checks the current authenticated wallet session.

### `POST /api/auth/logout`

Revokes the current wallet session.

### `POST /api/payments/request`

Builds and validates a Solana Pay-style receive request for native Testnet SOL.

### `POST /api/payments/parse`

Parses and validates a Solana Pay URI. SPL-token QR requests are rejected until the SPQC mint is verified on Testnet.

### `POST /api/chat`

Runs the agent planner with live Testnet chain context. Authenticated wallet context is accepted from the verified backend session rather than trusting a client-supplied address.

## Agentic / Multi-Model Layer

The backend supports a provider router:

1. OpenAI-compatible API when `OPENAI_API_KEY` + `OPENAI_MODEL` are configured;
2. Anthropic when `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` are configured;
3. Gemini when `GEMINI_API_KEY` + `GEMINI_MODEL` are configured;
4. deterministic local safe fallback when no external provider is configured.

Provider credentials are **server-side only** and must never use a `VITE_` prefix.

The agent:

- detects wallet/chain/project/developer/community intents;
- fetches Testnet chain health;
- optionally fetches connected public-wallet state;
- grounds the model request in live Testnet context;
- refuses to claim deployment success without chain evidence;
- never requests wallet secrets.

## One-Click Local Stack

Windows PowerShell:

```powershell
./scripts/one-click-testnet.ps1
```

Equivalent command:

```bash
docker compose -f docker-compose.testnet.yml up --build
```

Services:

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:8080/scstobcminority-ai/`

## One-Click GitHub Pipeline

Run:

**Actions → One-Click Full Stack Testnet → Run workflow**

The pipeline executes:

1. backend install, syntax checks and tests;
2. backend boot against Solana Testnet;
3. frontend Testnet build;
4. Solana Testnet program deployment;
5. SPQC mint initialization;
6. upgrade-authority transfer to project authority;
7. on-chain program and mint verification;
8. `TESTNET_DEPLOYMENT.md` evidence check;
9. optional public-backend health check when `TESTNET_BACKEND_URL` is configured.

## Public Web Deployment

**Primary full-stack target:** Netlify.

The repository contains `netlify.toml` and `netlify/functions/api.mjs`, so the frontend and backend API can share the same Netlify origin.

**GitHub Pages** is the static mirror. Its frontend is configured to use the Netlify origin for backend calls.

A public runtime should only be shown as healthy when `/health` and `/api/status` actually respond successfully.

## Model Secrets

Configure only the providers you want:

```
OPENAI_API_KEY
OPENAI_MODEL

ANTHROPIC_API_KEY
ANTHROPIC_MODEL

GEMINI_API_KEY
GEMINI_MODEL
```

The system remains functional with the local fallback if no external provider is enabled.

## Testnet Evidence Required Before Mainnet

All of the following must be true:

- CI backend gate green;
- CI frontend gate green;
- CI Rust gate green;
- Testnet deployment workflow green;
- both Anchor programs verified executable on Testnet;
- SPQC mint address recorded;
- custody initialization signature recorded;
- token initialization signature recorded;
- frontend wallet works on Testnet;
- frontend/backend wallet state agrees;
- backend transaction verification works;
- public backend health is green if public chat is enabled;
- no secrets are committed;
- independent security review is completed before handling real value.

## Mainnet Lock

Mainnet deployment is intentionally out of scope until Testnet evidence and release-readiness review are complete.

No pipeline in this blueprint automatically deploys to mainnet.


## Bidirectional Verification

### Top → bottom

1. User connects Phantom/Solflare in the React frontend.
2. Wallet signs a non-transaction authentication message when the user chooses **Verify wallet**.
3. Backend verifies Ed25519 ownership and creates a short-lived session.
4. Agent chat uses that authenticated wallet context.
5. Backend independently reads Solana Testnet state.
6. Program deployment pipeline builds Anchor/SBF programs.
7. Programs and SPQC mint are verified on-chain.
8. Verified IDs/signatures are written to both backend and frontend deployment JSON.

### Bottom → top

1. Solana Testnet program/mint accounts are queried after deployment.
2. Deployment workflow refuses to record success without executable program accounts and mint evidence.
3. Machine-readable deployment config is committed.
4. Backend loads the verified config and exposes program state through `/api/status`.
5. Frontend polls backend status instead of displaying placeholder deployment claims.
6. GitHub Pages rebuilds with the synchronized application.
7. Wallet transactions can be independently checked by the backend via `/api/tx/:signature`.

This closes the evidence loop from UI → wallet → backend → chain and chain → backend → UI.

## Public Backend Requirement

GitHub Pages remains static-only, so its API calls depend on the Netlify backend origin configured by the frontend.

Netlify Functions must expose `/health`, `/api/status`, wallet-auth, payments, transaction verification, and chat endpoints. External model providers remain optional and require server-side credentials.

A cloud build alone is not runtime evidence; backend health must be verified through the deployed endpoints.
