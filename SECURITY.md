# Security Policy — SCSTOBCMinority AI

## Current security status

SCSTOBCMinority AI is a **research/Testnet prototype**. It has not completed an independent professional smart-contract, cryptographic, infrastructure, or full-stack security audit.

Do not use this repository as evidence of regulatory certification, production security, or suitability for custody of real-value assets.

## Supported security boundary

Current repository safeguards include:

- user transaction signing remains inside the connected Phantom/Solflare wallet;
- the backend never requests or stores a wallet seed phrase or private key;
- wallet-to-backend authentication uses an Ed25519 `signMessage` challenge and a short-lived authenticated session;
- backend endpoints validate Solana addresses and transaction signatures before RPC queries;
- request bodies have size limits in the Node backend;
- the persistent Node backend has a basic per-IP in-memory rate limiter;
- frontend and backend target Solana Testnet;
- CI checks backend syntax/tests, frontend build, Rust workspace checks, and canonical branding;
- Mainnet deployment is intentionally gated behind Testnet evidence and further review.

These safeguards are useful engineering controls, not a security certification.

## Known limitations / open risks

- Testnet smart-contract deployment is not yet recorded as verified on-chain in `TESTNET_DEPLOYMENT.md`.
- The SPQC mint address and initialization transaction signatures are not yet recorded.
- End-to-end post-quantum security has not been independently verified.
- The custody program does not establish full on-chain PQC signature verification as a production guarantee.
- No independent penetration test, fuzzing campaign, or formal verification has been completed.
- Serverless deployments may need provider-native rate limiting/WAF controls beyond the Node in-memory limiter.
- External AI providers are optional and require server-side API keys; those providers have their own security/privacy boundaries.
- Token economics, treasury governance, and authority-management design require further review before real-value use.
- Dependency and supply-chain risk remains and should be continuously monitored.

## Vulnerability reporting

No dedicated security email, paid bug-bounty program, or 24/7 incident-response channel is currently configured.

Do **not** post secrets, private keys, seed phrases, or weaponized exploit details in a public issue. If you need to report a sensitive issue before a private channel is configured, open a minimal issue that requests a secure contact without including exploit details.

## No bug-bounty promise

There is currently **no funded or contractually committed bug-bounty reward program**. Any older reward amounts or payout promises should be treated as obsolete.

## User safety

- Never share a seed phrase or private key with this project, Netlify, GitHub, an AI model, or a support contact.
- Verify the network is Solana Testnet before signing test transactions.
- Review recipient, amount, and transaction details inside the wallet before approving.
- Use a dedicated Testnet wallet for testing.
- Do not treat SPQC or any project token as guaranteeing returns, rights, aid, or access.

## Production / Mainnet release gates

Before a production or Mainnet release, at minimum:

1. verified Testnet program deployment evidence;
2. recorded program IDs, mint address, PDAs, and initialization signatures;
3. independent smart-contract review;
4. independent cryptographic implementation review;
5. expanded integration and adversarial testing;
6. dependency/security scanning with reviewed findings;
7. treasury, upgrade-authority, and mint-authority governance review;
8. incident-response and private vulnerability-reporting channels;
9. privacy/legal review for any real beneficiary or financial data;
10. explicit Mainnet release approval.

**Last updated:** September 23, 2026
