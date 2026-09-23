# SCSTOBCMinority AI — Cloud Deployment Guide

## Canonical deployment model

- **Primary full-stack host:** Netlify
- **Static mirror:** GitHub Pages
- **Blockchain target:** Solana Testnet
- **Mainnet:** disabled pending release gates

The repository includes `netlify.toml` and `netlify/functions/api.mjs`, so Netlify can build the React app and expose the backend API on the same origin.

## Netlify

Repository configuration:

```text
Build command:      cd app && npm ci && npm run build
Publish directory:  app/dist
Functions directory: netlify/functions
Node:               20
```

Required/important environment variables:

```text
NODE_ENV=production
SOLANA_NETWORK=testnet
SOLANA_RPC_URL=https://api.testnet.solana.com
WALLET_AUTH_SECRET=<32+ random characters>
```

Optional external AI providers require server-side key + model variables. Never expose provider secrets as `VITE_*` values.

Never place wallet seed phrases/private keys in Netlify environment variables.

## GitHub Pages

GitHub Pages hosts the static frontend mirror. The frontend is configured to use the Netlify origin for backend calls when loaded from `elon00.github.io`.

## Solana Testnet programs

Use the evidence-gated GitHub Actions workflow:

`.github/workflows/deploy-testnet.yml`

The workflow requires a funded Testnet payer. Public Testnet faucet rate limits are unreliable; use a dedicated **Testnet-only** signer secret when necessary.

Deployment is complete only after executable program accounts, SPQC mint, PDAs, and initialization transaction signatures are verified and written to `TESTNET_DEPLOYMENT.md`.

## Local full-stack validation

```bash
npm run testnet:stack
```

or:

```bash
./scripts/one-click-testnet.sh
```

## Security

- Never reuse a personal/main-value wallet deployer secret.
- Never commit `WALLET_AUTH_SECRET` or AI API keys.
- Mainnet root commands intentionally fail until release gates pass.
- Do not claim production/audit/compliance status from a successful cloud build alone.

See [SECURITY.md](./SECURITY.md) and [docs/reality/REALITY_AUDIT.md](./docs/reality/REALITY_AUDIT.md).
