import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE_URL } from '../config';

export type BackendWalletAuthState =
  | 'disconnected'
  | 'backend-offline'
  | 'unverified'
  | 'verifying'
  | 'verified'
  | 'unsupported'
  | 'error';

type BackendWalletContextValue = {
  authState: BackendWalletAuthState;
  sessionToken: string;
  error: string;
  backendReady: boolean;
  authenticatedWallet: string | null;
  expiresAt: number | null;
  verifyWallet: () => Promise<void>;
  logoutBackendWallet: () => void;
};

const BackendWalletContext = createContext<BackendWalletContextValue | null>(null);

const storageKey = (wallet: string) => `scstobcminority-ai:wallet-session:${wallet}`;

export function BackendWalletProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, signMessage } = useWallet();
  const [authState, setAuthState] = useState<BackendWalletAuthState>(
    API_BASE_URL ? 'disconnected' : 'backend-offline'
  );
  const [sessionToken, setSessionToken] = useState('');
  const [authenticatedWallet, setAuthenticatedWallet] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  const clearSession = useCallback((wallet?: string) => {
    setSessionToken('');
    setAuthenticatedWallet(null);
    setExpiresAt(null);
    setError('');
    if (wallet && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey(wallet));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const wallet = publicKey?.toBase58() || '';

    const restore = async () => {
      if (!API_BASE_URL) {
        clearSession(wallet);
        if (!cancelled) setAuthState('backend-offline');
        return;
      }
      if (!connected || !wallet) {
        clearSession(wallet);
        if (!cancelled) setAuthState('disconnected');
        return;
      }
      if (!signMessage) {
        clearSession(wallet);
        if (!cancelled) setAuthState('unsupported');
        return;
      }

      const saved = window.sessionStorage.getItem(storageKey(wallet));
      if (!saved) {
        clearSession();
        if (!cancelled) setAuthState('unverified');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
          headers: { authorization: `Bearer ${saved}` }
        });
        const data = await response.json();
        if (!response.ok || !data?.verified || data?.walletAddress !== wallet) {
          throw new Error(data?.error || 'Saved wallet session is invalid');
        }
        if (!cancelled) {
          setSessionToken(saved);
          setAuthenticatedWallet(wallet);
          setExpiresAt(Number(data.expiresAt) || null);
          setError('');
          setAuthState('verified');
        }
      } catch {
        window.sessionStorage.removeItem(storageKey(wallet));
        if (!cancelled) {
          clearSession();
          setAuthState('unverified');
        }
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connected, signMessage, clearSession]);

  const verifyWallet = useCallback(async () => {
    const wallet = publicKey?.toBase58() || '';
    if (!API_BASE_URL) {
      setAuthState('backend-offline');
      setError('Public backend is not connected to this deployment.');
      return;
    }
    if (!connected || !wallet) {
      setAuthState('disconnected');
      setError('Connect Phantom or Solflare first.');
      return;
    }
    if (!signMessage) {
      setAuthState('unsupported');
      setError('This wallet adapter does not support message signing.');
      return;
    }

    setAuthState('verifying');
    setError('');

    try {
      const challengeResponse = await fetch(`${API_BASE_URL}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet })
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
          walletAddress: wallet,
          message: challenge.message,
          signature,
          challengeToken: challenge.challengeToken
        })
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified?.verified || !verified?.token) {
        throw new Error(verified?.error || `HTTP ${verifyResponse.status}`);
      }

      window.sessionStorage.setItem(storageKey(wallet), verified.token);
      setSessionToken(verified.token);
      setAuthenticatedWallet(wallet);
      setExpiresAt(Number(verified.expiresAt) || null);
      setAuthState('verified');
    } catch (reason) {
      clearSession(wallet);
      setAuthState('error');
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, [publicKey, connected, signMessage, clearSession]);

  const logoutBackendWallet = useCallback(() => {
    const wallet = publicKey?.toBase58() || '';
    clearSession(wallet);
    setAuthState(API_BASE_URL ? (connected ? 'unverified' : 'disconnected') : 'backend-offline');
  }, [publicKey, connected, clearSession]);

  const value = useMemo<BackendWalletContextValue>(() => ({
    authState,
    sessionToken,
    error,
    backendReady: Boolean(API_BASE_URL),
    authenticatedWallet,
    expiresAt,
    verifyWallet,
    logoutBackendWallet
  }), [authState, sessionToken, error, authenticatedWallet, expiresAt, verifyWallet, logoutBackendWallet]);

  return (
    <BackendWalletContext.Provider value={value}>
      {children}
    </BackendWalletContext.Provider>
  );
}

export function useBackendWallet() {
  const value = useContext(BackendWalletContext);
  if (!value) throw new Error('useBackendWallet must be used inside BackendWalletProvider');
  return value;
}
