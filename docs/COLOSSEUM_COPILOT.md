# Colosseum Copilot research setup

Official instructions: https://docs.colosseum.com/copilot/getting-started

Copilot is a research skill for competitive landscape and product validation. Connecting it does not deploy contracts, complete a security audit, submit a hackathon entry, or certify eligibility.

1. Obtain your PAT at https://colosseum.com/arena/copilot and store it in a private environment or secret manager. Do not paste it into chat, source code, frontend variables, or commits.
2. Set `COLOSSEUM_COPILOT_API_BASE` to `https://copilot.colosseum.com/api/v1` and set `COLOSSEUM_COPILOT_PAT` privately.
3. In your own Codex/Claude Code terminal, install the official skill with `npx skills add ColosseumOrg/colosseum-copilot`.
4. In this repository run `npm run copilot:check`. This read-only check prints no token or raw response and refuses redirects or a different API host.

Research prompt for this project:

> Assess SCSTOBCMinority AI, a Solana Testnet research prototype for wallet payments and community utility with experimental post-quantum SDKs. Find direct competitors in wallet infrastructure, community payments and post-quantum custody. Cite projects and current evidence, distinguish genuine product gaps from already solved problems, and recommend one narrow buildable use case. Treat custom program deployment and on-chain PQC verification as incomplete until independently demonstrated.

The sample prediction-market question in Copilot's onboarding is an example; it does not change this project's purpose.

Status at setup: no PAT was available in the execution environment, so authenticated research could not be performed. An active token in the Colosseum website does not automatically make it available to this assistant.
