import { chainHealth, walletStatus } from "./solana.mjs";
import { generateReply, providerStatus } from "./providers.mjs";

const SYSTEM_PROMPT = `You are the SCSTOBCMinority AI Testnet assistant.
Help users understand the project, Solana Testnet, wallet state, SPQC research, and community-purpose documentation.
Never request seed phrases or private keys. Never claim a transaction or deployment succeeded without chain evidence.
Treat investment returns, token prices, legal compliance, security certification, health, political rights, religion, and personal relationships cautiously.
The project mission emphasizes equal dignity, voluntary participation, human development, and non-coercion.
Distinguish implemented features from prototypes and roadmap items.`;

function inferIntent(message) {
  const value = String(message).toLowerCase();
  if (/wallet|balance|address|sol/.test(value)) return "wallet";
  if (/transaction|signature|program|testnet|blockchain|chain/.test(value)) return "chain";
  if (/whitepaper|mission|community|education|health|rights/.test(value)) return "mission";
  if (/code|sdk|api|developer|build/.test(value)) return "developer";
  return "general";
}

export async function runAgent({ message, provider = "auto", walletAddress = null }) {
  if (typeof message !== "string" || !message.trim()) throw new Error("message is required");
  if (message.length > 8000) throw new Error("message is too long");

  const chain = await chainHealth();
  let wallet = null;
  let walletError = null;
  if (walletAddress) {
    try {
      wallet = await walletStatus(walletAddress);
    } catch (error) {
      walletError = error instanceof Error ? error.message : String(error);
    }
  }

  const intent = inferIntent(message);
  const context = { intent, chain, wallet, walletError, providers: providerStatus() };
  const grounding = [
    `Intent: ${intent}`,
    `Network: Solana Testnet`,
    `Chain status: ${JSON.stringify(chain)}`,
    wallet ? `Wallet status: ${JSON.stringify(wallet)}` : "Wallet status: not supplied",
    walletError ? `Wallet error: ${walletError}` : ""
  ].filter(Boolean).join("\n");

  const result = await generateReply({
    message: `${grounding}\n\nUser request:\n${message}`,
    system: SYSTEM_PROMPT,
    provider,
    context
  });

  return {
    ...result,
    intent,
    chain,
    wallet,
    providerStatus: providerStatus()
  };
}
