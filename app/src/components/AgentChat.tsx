import { FormEvent, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE_URL } from '../config';

type ChatLine = {
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
};

type BackendStatus = {
  chain?: { ok?: boolean; network?: string; slot?: number; error?: string };
  providers?: Record<string, { configured?: boolean; model?: string | null }>;
};

const AgentChat = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [provider, setProvider] = useState('auto');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [walletSession, setWalletSession] = useState('');
  const [walletAuth, setWalletAuth] = useState<'unverified' | 'verifying' | 'verified' | 'unsupported' | 'backend-offline' | 'error'>(
    API_BASE_URL ? 'unverified' : 'backend-offline'
  );
  const [walletAuthError, setWalletAuthError] = useState('');
  const [messages, setMessages] = useState<ChatLine[]>([
    {
      role: 'assistant',
      text: 'Solana PQC Testnet assistant. I can use backend Testnet RPC context and configured model providers without accessing your private keys.'
    }
  ]);

  useEffect(() => {
    setWalletSession('');
    setWalletAuth(
      !API_BASE_URL
        ? 'backend-offline'
        : publicKey
          ? (signMessage ? 'unverified' : 'unsupported')
          : 'unverified'
    );
    setWalletAuthError('');
  }, [publicKey, signMessage]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!API_BASE_URL) {
        setStatusError('Backend URL is not configured for this web deployment.');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setStatus(data);
          setStatusError('');
        }
      } catch (error) {
        if (!cancelled) setStatusError(error instanceof Error ? error.message : String(error));
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const verifyWallet = async () => {
    if (!API_BASE_URL) {
      setWalletAuth('backend-offline');
      setWalletAuthError('Public backend is not connected to this deployment yet.');
      return;
    }
    if (!connected || !publicKey || !signMessage) {
      setWalletAuth(signMessage ? 'error' : 'unsupported');
      setWalletAuthError(!signMessage ? 'This wallet adapter does not support message signing.' : 'Connect a wallet first.');
      return;
    }

    setWalletAuth('verifying');
    setWalletAuthError('');
    try {
      const challengeResponse = await fetch(`${API_BASE_URL}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() })
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge?.error || `HTTP ${challengeResponse.status}`);

      const signed = await signMessage(new TextEncoder().encode(challenge.message));
      const binary = Array.from(signed, (byte) => String.fromCharCode(byte)).join('');
      const signature = window.btoa(binary);

      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message: challenge.message,
          signature,
          challengeToken: challenge.challengeToken
        })
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified?.verified || !verified?.token) {
        throw new Error(verified?.error || `HTTP ${verifyResponse.status}`);
      }
      setWalletSession(verified.token);
      setWalletAuth('verified');
    } catch (error) {
      setWalletSession('');
      setWalletAuth('error');
      setWalletAuthError(error instanceof Error ? error.message : String(error));
    }
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');

    if (!API_BASE_URL) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: 'Backend is not configured on this deployment yet. Set VITE_API_BASE_URL to the deployed backend URL.'
      }]);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(walletSession ? { authorization: `Bearer ${walletSession}` } : {})
        },
        body: JSON.stringify({
          message,
          provider,
          walletAddress: walletAuth === 'verified' ? publicKey?.toBase58() || null : null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: data.reply,
        provider: data.provider
      }]);
      setStatus({
        chain: data.chain,
        providers: data.providerStatus
      });
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `Backend error: ${error instanceof Error ? error.message : String(error)}`
      }]);
    } finally {
      setBusy(false);
    }
  };

  const configuredProviders = status?.providers
    ? Object.entries(status.providers).filter(([, value]) => value.configured)
    : [];

  return (
    <section className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">AI Agentic Multi-Model Chat</h3>
          <p className="text-sm text-gray-400">
            Backend-grounded on Solana Testnet. Wallet signing stays in your wallet.
          </p>
        </div>
        <div className="text-xs">
          {status?.chain?.ok ? (
            <span className="text-green-400">● Testnet RPC active · slot {status.chain.slot}</span>
          ) : (
            <span className="text-yellow-400">● Backend/Testnet not verified</span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {configuredProviders.map(([name, value]) => (
          <span key={name} className="px-2 py-1 rounded bg-gray-900 text-gray-300">
            {name}: {value.model || 'configured'}
          </span>
        ))}
        {!configuredProviders.length && (
          <span className="px-2 py-1 rounded bg-gray-900 text-gray-400">
            {API_BASE_URL ? 'Provider status loading…' : 'Public backend not connected'}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-gray-900 px-2 py-1 text-gray-300">
          Wallet auth: {walletAuth}
        </span>
        {publicKey && walletAuth !== 'verified' && (
          <button
            type="button"
            onClick={verifyWallet}
            disabled={walletAuth === 'verifying' || walletAuth === 'unsupported' || walletAuth === 'backend-offline'}
            className="rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-3 py-1 text-white"
          >
            {walletAuth === 'verifying'
              ? 'Verifying…'
              : walletAuth === 'backend-offline'
                ? 'Backend not connected'
                : 'Verify wallet'}
          </button>
        )}
        {walletAuthError && <span className="text-yellow-300">{walletAuthError}</span>}
      </div>

      {statusError && (
        <div className="mb-3 rounded border border-yellow-700 bg-yellow-900/20 p-3 text-xs text-yellow-300">
          {statusError}
        </div>
      )}

      <div className="h-72 overflow-y-auto space-y-3 rounded bg-gray-900/60 p-4 mb-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={
              message.role === 'user'
                ? 'inline-block max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white'
                : 'inline-block max-w-[85%] rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-200'
            }>
              {message.text}
              {message.provider && (
                <div className="mt-1 text-[10px] text-gray-400">provider: {message.provider}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="auto">Auto model router</option>
            <option value="local">Local safe fallback</option>
            <option value="openai">OpenAI-compatible</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about Testnet, wallet, SPQC, project mission or code…"
            className="min-w-0 flex-1 rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
          />
          <button
            disabled={busy}
            className="rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white"
          >
            {busy ? 'Working…' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Connected wallet: {publicKey ? publicKey.toBase58() : 'none'} · authenticated: {walletAuth === 'verified' ? 'yes' : 'no'}. Seed phrases/private keys are never sent.
        </p>
      </form>
    </section>
  );
};

export default AgentChat;
