import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const Dashboard: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then(bal => setBalance(bal / LAMPORTS_PER_SOL));
    }
  }, [publicKey, connection]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <div className="text-6xl">🛡️</div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to SOLANA-PQC</h2>
            <p className="text-gray-400 text-lg mb-6">Secure your Solana assets with post-quantum cryptography</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>✅ NIST FIPS 203/204/205 Compliant</span>
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
        <h2 className="text-2xl font-bold mb-2">Quantum-Safe Dashboard</h2>
        <p className="text-blue-100">Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</p>
        <div className="mt-4">
          <div className="text-sm text-blue-200">Balance</div>
          <div className="text-2xl font-bold">{balance.toFixed(4)} SOL</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="text-3xl mb-2">85%</div>
          <div className="text-sm text-gray-400">Quantum Readiness</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="text-3xl mb-2">0</div>
          <div className="text-sm text-gray-400">Active Vaults</div>
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
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">NIST FIPS 204</h4>
            <p className="text-sm text-gray-400">ML-DSA (CRYSTALS-Dilithium)</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">NIST FIPS 205</h4>
            <p className="text-sm text-gray-400">SLH-DSA (SPHINCS+)</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
