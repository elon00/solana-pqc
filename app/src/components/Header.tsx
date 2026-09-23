import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../config';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-2xl">🛡️</div>
            <div>
              <h1 className="text-xl font-bold text-white">{APP_NAME}</h1>
              <p className="text-xs text-gray-400">{APP_TAGLINE}</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <div className="text-xs text-gray-400">Network</div>
              <div className="text-sm font-semibold text-blue-400">Testnet</div>
            </div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
