import { useMemo } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { NETWORK, RPC_ENDPOINT } from './config';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: NETWORK })], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
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
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
