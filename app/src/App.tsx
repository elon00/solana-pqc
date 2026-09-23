import { useMemo } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SOLANA_RPC_URL } from './config';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { BackendWalletProvider } from './context/BackendWalletContext';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const network = WalletAdapterNetwork.Testnet;
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BackendWalletProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={
                  <>
                    <Header />
                    <main className="container mx-auto px-4 py-8">
                      <Dashboard />
                    </main>
                  </>
                } />
              </Routes>
            </div>
          </Router>
          </BackendWalletProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
