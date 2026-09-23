export const APP_NAME = "SCSTOBCMinority AI";
export const APP_TAGLINE = "Quantum-Safe Custody · Testnet";

export const SOLANA_NETWORK = "testnet";
export const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://api.testnet.solana.com";

const browserOrigin =
  typeof window !== "undefined" &&
  (window.location.hostname.endsWith(".vercel.app") || window.location.hostname.endsWith(".netlify.app"))
    ? window.location.origin
    : "";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : browserOrigin);

export const QUANTUM_CUSTODY_PROGRAM_ID =
  import.meta.env.VITE_QUANTUM_CUSTODY_PROGRAM_ID || "";

export const SPQC_TOKEN_PROGRAM_ID =
  import.meta.env.VITE_SPQC_TOKEN_PROGRAM_ID || "";

export const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=testnet`;


export const explorerAccountUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=testnet`;
