import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Network configuration - currently Solana Testnet (easy toggle to Mainnet in the future)
export const NETWORK: WalletAdapterNetwork = WalletAdapterNetwork.Testnet;
export const RPC_ENDPOINT = clusterApiUrl(NETWORK);
export const CLUSTER_PARAM = 'testnet';
export const NETWORK_LABEL = 'Testnet';

// On-chain deployed Solana Testnet program & deployer
export const PROGRAM_ID = 'Bnpd9YGaVxMAwdxFoVA3SQP1Vhfwv7jnJ67QNcyAVKq3';
export const DEPLOYER_ADDRESS = '8qhW8ctXX77UNLTY9kx3XoAoH8kstQXPbCghUwqu34es';

// Branding & Metadata
export const APP_NAME = 'Solana PQC';
export const APP_TAGLINE = 'Quantum-Resistant Solana Wallet';
export const GITHUB_REPO_URL = 'https://github.com/elon00/scstobcminority-ai';
