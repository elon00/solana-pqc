import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import AgentChat from './AgentChat';
import PaymentPanel from './PaymentPanel';
import { API_BASE_URL, APP_NAME } from '../config';
import { useBackendWallet } from '../context/BackendWalletContext';

const Dashboard: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [backendWallet, setBackendWallet] = useState<{ sol?: number; accountExists?: boolean } | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const {
    authState,
    sessionToken,
    error: backendAuthError,
    verifyWallet,
    logoutBackendWallet
  } = useBackendWallet();

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then(bal => setBalance(bal / LAMPORTS_PER_SOL));
    }
  }, [publicKey, connection]);

  useEffect(() => {
    let cancelled = false;
    const syncBackendWallet = async () => {
      if (!publicKey || !API_BASE_URL) {
        setBackendStatus(API_BASE_URL ? 'wallet-not-connected' : 'backend-not-configured');
        setBackendWallet(null);
        return;
      }
      if (authState !== 'verified' || !sessionToken) {
        setBackendStatus('wallet-not-verified');
        setBackendWallet(null);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/me`, {
          headers: { authorization: `Bearer ${sessionToken}` }
        });
        const data = await response.json();
        if (!response.ok || !data?.authenticated) {
          throw new Error(data?.error || `HTTP ${response.status}`);
        }
        if (!cancelled) {
          setBackendWallet(data.wallet);
          setBackendStatus('authenticated-and-synchronized');
        }
      } catch {
        if (!cancelled) setBackendStatus('backend-session-unavailable');
      }
    };
    syncBackendWallet();
    const id = window.setInterval(syncBackendWallet, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [publicKey, authState, sessionToken]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <div className="text-6xl">🛡️</div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to {APP_NAME}</h2>
            <p className="text-gray-400 text-lg mb-6">Connect a wallet to the synchronized Solana Testnet research environment</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>🧪 PQC research targets: FIPS 203/204/205 families</span>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
            <p className="text-gray-300 mb-4">Connect your wallet to get started</p>
            <div className="text-sm text-gray-500">Supported: Phantom, Solflare</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{APP_NAME} Testnet Dashboard</h2>
        <p className="text-blue-100">Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</p>
        <div className="mt-4">
          <div className="text-sm text-blue-200">Balance</div>
          <div className="text-2xl font-bold">{balance.toFixed(4)} SOL</div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-5 border border-gray-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-gray-400">Backend Wallet Authentication</div>
            <div className={authState === 'verified' ? 'text-green-400 font-semibold' : 'text-yellow-300 font-semibold'}>
              {authState === 'verified' ? '✓ Wallet cryptographically connected to backend' : `Wallet auth: ${authState}`}
            </div>
            {backendAuthError && <div className="mt-1 text-xs text-yellow-300">{backendAuthError}</div>}
          </div>
          <div className="flex gap-2">
            {authState !== 'verified' ? (
              <button
                type="button"
                onClick={verifyWallet}
                disabled={authState === 'verifying' || authState === 'backend-offline' || authState === 'unsupported'}
                className="rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
              >
                {authState === 'verifying' ? 'Verifying…' : 'Connect wallet to backend'}
              </button>
            ) : (
              <button
                type="button"
                onClick={logoutBackendWallet}
                className="rounded bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Disconnect backend session
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="text-3xl mb-2">{backendStatus === 'authenticated-and-synchronized' ? '✓' : '○'}</div>
          <div className="text-sm text-gray-400">Frontend ↔ Backend Wallet Sync</div>
          <div className="text-xs text-gray-500 mt-2">{backendStatus}</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="text-3xl mb-2">{backendWallet?.sol?.toFixed(4) ?? '—'}</div>
          <div className="text-sm text-gray-400">Backend Testnet SOL View</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="text-3xl mb-2">0</div>
          <div className="text-sm text-gray-400">Transactions</div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">NIST FIPS 203</h4>
            <p className="text-sm text-gray-400">ML-KEM (CRYSTALS-Kyber)</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">Research / verify before production</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">NIST FIPS 204</h4>
            <p className="text-sm text-gray-400">ML-DSA (CRYSTALS-Dilithium)</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">Research / verify before production</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">NIST FIPS 205</h4>
            <p className="text-sm text-gray-400">SLH-DSA (SPHINCS+)</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">Research / verify before production</span>
          </div>
        </div>
      </div>

      <PaymentPanel />

      <AgentChat />
    </div>
  );
};

export default Dashboard;
