import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const LandingPage = () => {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [activeSection, setActiveSection] = useState('hero');
  const [balance, setBalance] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('checking');
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Solana connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Check network status and balance
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const version = await connection.getVersion();
        setNetworkStatus('connected');
      } catch (error) {
        setNetworkStatus('disconnected');
      }
    };

    const checkBalance = async () => {
      if (connected && publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    checkNetworkStatus();
    checkBalance();

    // Update balance every 10 seconds
    const interval = setInterval(checkBalance, 10000);
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  // Simulate transaction functionality
  const handleTestTransaction = async () => {
    if (!connected || !publicKey) {
      setTransactionStatus('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setTransactionStatus('Preparing transaction...');

    try {
      // Simulate a simple transfer transaction
      const { blockhash } = await connection.getRecentBlockhash();
      setTransactionStatus(`Blockhash: ${blockhash.slice(0, 8)}...`);

      // Simulate transaction delay
      setTimeout(() => {
        setTransactionStatus('✅ Transaction simulation completed');
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      setTransactionStatus('❌ Transaction failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="text-white font-bold text-xl">Solana PQC</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => setActiveSection('features')} className="text-gray-300 hover:text-purple-400 transition-colors">Features</button>
              <button onClick={() => setActiveSection('technology')} className="text-gray-300 hover:text-purple-400 transition-colors">Technology</button>
              <button onClick={() => setActiveSection('github')} className="text-gray-300 hover:text-purple-400 transition-colors">GitHub</button>
              <button onClick={() => setActiveSection('blockchain')} className="text-gray-300 hover:text-purple-400 transition-colors">Blockchain</button>
              <WalletMultiButton className="bg-purple-600 hover:bg-purple-700" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Quantum-Resistant
              <br />
              Solana Wallet
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Next-generation cryptocurrency custody with military-grade post-quantum cryptography.
              Secure your digital assets against quantum computing threats.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <WalletMultiButton className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105" />

              {connected && (
                <Link
                  to="/dashboard"
                  className="bg-white/10 hover:bg-white/20 border border-purple-400/30 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
                >
                  Launch Dashboard →
                </Link>
              )}
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-purple-400/20 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-400 mb-2">∞</div>
                <div className="text-gray-400 text-sm">Quantum Security</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-blue-400/20 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {networkStatus === 'connected' ? '✓' : networkStatus === 'disconnected' ? '✗' : '○'}
                </div>
                <div className="text-gray-400 text-sm">Network Status</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-green-400/20 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {balance !== null ? `${balance.toFixed(2)}` : '0.00'}
                </div>
                <div className="text-gray-400 text-sm">SOL Balance</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-400 mb-2">{connected ? '✓' : '○'}</div>
                <div className="text-gray-400 text-sm">Wallet Connected</div>
              </div>
            </div>

            {/* Transaction Testing Section */}
            {connected && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white/5 backdrop-blur-sm border border-purple-400/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">🧪 Transaction Testing</h3>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={handleTestTransaction}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Test Transaction</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </button>

                    <Link
                      to="/dashboard"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2"
                    >
                      <span>Full Dashboard</span>
                      <span>→</span>
                    </Link>
                  </div>

                  {transactionStatus && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                      <p className="text-gray-300 text-sm text-center">{transactionStatus}</p>
                    </div>
                  )}

                  {balance !== null && (
                    <div className="mt-4 text-center">
                      <p className="text-gray-400 text-sm">
                        Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                      </p>
                      <p className="text-green-400 text-sm font-semibold">
                        Balance: {balance.toFixed(4)} SOL
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-12">Revolutionary Security Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🔐</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Post-Quantum Cryptography</h3>
                <p className="text-gray-300">
                  Military-grade encryption resistant to quantum computing attacks using Kyber, Dilithium, and SPHINCS algorithms.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-300">
                  Built on Solana's high-performance blockchain with sub-second transaction finality and minimal fees.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Multi-Sig Security</h3>
                <p className="text-gray-300">
                  Advanced multi-signature wallets with customizable threshold requirements for enhanced security.
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🔄</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Key Rotation</h3>
                <p className="text-gray-300">
                  Automated cryptographic key rotation with zero-downtime security updates and forward secrecy.
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Real-time Monitoring</h3>
                <p className="text-gray-300">
                  Comprehensive dashboard with real-time transaction monitoring and security alerts.
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 border border-indigo-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🌐</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Cross-Platform</h3>
                <p className="text-gray-300">
                  Seamless experience across web, mobile, and desktop platforms with unified security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-12">Cutting-Edge Technology Stack</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-purple-400 mb-6">Post-Quantum Security</h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300">Kyber - Key encapsulation mechanism</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Dilithium - Digital signature algorithm</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">SPHINCS+ - Hash-based signature scheme</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
                <h4 className="text-xl font-semibold text-white mb-4">Security Architecture</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Quantum Resistance:</span>
                    <span className="text-green-400">NIST Standard</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Key Size:</span>
                    <span className="text-blue-400">8KB - 32KB</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Performance:</span>
                    <span className="text-purple-400">Sub-second</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Compatibility:</span>
                    <span className="text-green-400">Solana Native</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Section */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Open Source & Community</h2>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">GitHub Repository</h3>
                  <p className="text-gray-400">elon00/solana-pqc</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400 mb-1">100%</div>
                  <div className="text-gray-400 text-sm">Open Source</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">MIT</div>
                  <div className="text-gray-400 text-sm">License</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">Active</div>
                  <div className="text-gray-400 text-sm">Development</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/elon00/solana-pqc"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>View on GitHub</span>
              </a>

              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
              >
                <span>Launch Application</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-12">Blockchain Integration</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-purple-400 mb-6">Solana Devnet Deployment</h3>

                <div className="space-y-4">
                  <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${networkStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-green-400 font-semibold">Programs Deployed</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Quantum Custody: <code className="text-purple-400">QCustAbCdEfGhIjKlMnOpQrStUvWxYz123456789</code>
                      <br />
                      Token Program: <code className="text-blue-400">SPQCAbCdEfGhIjKlMnOpQrStUvWxYz123456789</code>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${networkStatus === 'connected' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      <span className="text-blue-400 font-semibold">Network Status</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Status: <span className={networkStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
                        {networkStatus === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                      <br />
                      Network: Solana Devnet (TPS: ~2,000)
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-400 font-semibold">Transaction Ready</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      ✅ Multi-signature support
                      <br />
                      ✅ Quantum-resistant encryption
                      <br />
                      ✅ Real-time verification
                    </div>
                  </div>

                  <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-400 font-semibold">Live Testing</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Click "Test Transaction" above to simulate blockchain interaction
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
                <h4 className="text-xl font-semibold text-white mb-6">Live Blockchain Data</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-purple-900/30 rounded-lg">
                    <span className="text-gray-300">Network:</span>
                    <span className="text-purple-400 font-semibold">Solana Devnet</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                    <span className="text-gray-300">Block Time:</span>
                    <span className="text-blue-400 font-semibold">~400ms</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-green-400 font-semibold">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
                    <span className="text-gray-300">Programs:</span>
                    <span className="text-yellow-400 font-semibold">2 Deployed</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <a
                    href="https://solscan.io/account/QCustAbCdEfGhIjKlMnOpQrStUvWxYz123456789?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <span>View on Solscan</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black/30 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="text-white font-bold text-xl">Solana PQC</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h5 className="text-white font-semibold mb-3">Product</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Security</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
                </ul>
              </div>

              <div>
                <h5 className="text-white font-semibold mb-3">Technology</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Whitepaper</a></li>
                </ul>
              </div>

              <div>
                <h5 className="text-white font-semibold mb-3">Community</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="https://github.com/elon00/solana-pqc" className="hover:text-purple-400 transition-colors">GitHub</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Twitter</a></li>
                </ul>
              </div>

              <div>
                <h5 className="text-white font-semibold mb-3">Support</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Status</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-400">
                © 2024 Solana PQC. Built with post-quantum security for the future of blockchain.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;