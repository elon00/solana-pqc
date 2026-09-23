import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { API_BASE_URL, APP_NAME, explorerTxUrl } from '../config';

type ParsedPayment = {
  recipient: string;
  amount: string | null;
  label?: string | null;
  message?: string | null;
  memo?: string | null;
  uri: string;
};

function normalizeAmount(raw: string, optional = true) {
  const value = raw.trim();
  if (!value) {
    if (optional) return null;
    throw new Error('Amount is required');
  }
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(value)) throw new Error('Invalid SOL amount');
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('SOL amount must be greater than zero');
  return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;
}

function localBuild(recipient: string, amount: string, memo: string): ParsedPayment {
  new PublicKey(recipient);
  const normalized = normalizeAmount(amount, true);
  const params = new URLSearchParams();
  if (normalized) params.set('amount', normalized);
  params.set('label', APP_NAME);
  if (memo.trim()) params.set('message', memo.trim().slice(0, 140));
  const uri = `solana:${recipient}?${params.toString()}`;
  return { recipient, amount: normalized, label: APP_NAME, message: memo.trim() || null, uri };
}

function localParse(uri: string): ParsedPayment {
  const value = uri.trim();
  if (!value.toLowerCase().startsWith('solana:')) throw new Error('QR payload is not a Solana Pay URI');
  const body = value.slice(7);
  const q = body.indexOf('?');
  const recipient = q === -1 ? body : body.slice(0, q);
  new PublicKey(recipient);
  const params = new URLSearchParams(q === -1 ? '' : body.slice(q + 1));
  if (params.has('spl-token')) throw new Error('SPL-token QR is disabled until the SPQC mint is verified on Testnet');
  return {
    recipient,
    amount: normalizeAmount(params.get('amount') || '', true),
    label: params.get('label'),
    message: params.get('message'),
    memo: params.get('memo'),
    uri: value
  };
}

export default function PaymentPanel() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveMemo, setReceiveMemo] = useState('');
  const [receiveUri, setReceiveUri] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [payPayload, setPayPayload] = useState('');
  const [parsed, setParsed] = useState<ParsedPayment | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [signature, setSignature] = useState('');

  const walletAddress = useMemo(() => publicKey?.toBase58() || '', [publicKey]);

  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      if (!walletAddress) {
        setReceiveUri('');
        setQrImage('');
        return;
      }
      try {
        let request: ParsedPayment;
        if (API_BASE_URL) {
          const response = await fetch(`${API_BASE_URL}/api/payments/request`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              recipient: walletAddress,
              amount: receiveAmount,
              label: APP_NAME,
              message: receiveMemo
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
          request = data;
        } else {
          request = localBuild(walletAddress, receiveAmount, receiveMemo);
        }
        const image = await QRCode.toDataURL(request.uri, { width: 260, margin: 2 });
        if (!cancelled) {
          setReceiveUri(request.uri);
          setQrImage(image);
        }
      } catch (reason) {
        if (!cancelled) {
          setReceiveUri('');
          setQrImage('');
          setStatus(reason instanceof Error ? reason.message : String(reason));
        }
      }
    };
    build();
    return () => { cancelled = true; };
  }, [walletAddress, receiveAmount, receiveMemo]);

  const parsePayload = async (value: string) => {
    setStatus('');
    setSignature('');
    try {
      let next: ParsedPayment;
      if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/api/payments/parse`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ uri: value })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
        next = data;
      } else {
        next = localParse(value);
      }
      setPayPayload(value);
      setParsed(next);
      setStatus('QR/payment request validated for Solana Testnet.');
    } catch (reason) {
      setParsed(null);
      setStatus(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const scanImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus('Scanning QR image…');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Unable to read QR image'));
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas is unavailable');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(pixels.data, canvas.width, canvas.height);
      if (!decoded?.data) throw new Error('No readable QR code found in the image');
      await parsePayload(decoded.data);
    } catch (reason) {
      setParsed(null);
      setStatus(reason instanceof Error ? reason.message : String(reason));
    } finally {
      URL.revokeObjectURL(url);
      event.target.value = '';
    }
  };

  const sendPayment = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      setStatus('Connect Phantom or Solflare first.');
      return;
    }
    if (!parsed) {
      setStatus('Validate a payment QR/request first.');
      return;
    }
    if (!parsed.amount) {
      setStatus('This QR has no amount. Add an amount to the request before sending.');
      return;
    }

    setBusy(true);
    setSignature('');
    try {
      const amount = Number(parsed.amount);
      const lamports = Math.round(amount * LAMPORTS_PER_SOL);
      if (!Number.isSafeInteger(lamports) || lamports <= 0) throw new Error('SOL amount is outside the safe transfer range');

      const recipient = new PublicKey(parsed.recipient);
      const latest = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight
      }).add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipient,
        lamports
      }));

      setStatus('Requesting wallet signature…');
      const txSignature = await sendTransaction(transaction, connection);
      setSignature(txSignature);
      setStatus('Transaction submitted; waiting for Testnet confirmation…');

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight
      }, 'confirmed');

      if (API_BASE_URL) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/tx/${txSignature}`);
          const verified = await response.json();
          if (response.ok && verified?.found && !verified?.error) {
            setStatus('Confirmed on Solana Testnet and independently observed by the backend.');
          } else {
            setStatus('Confirmed by wallet RPC; backend observation is still pending.');
          }
        } catch {
          setStatus('Confirmed by wallet RPC; backend is temporarily unreachable.');
        }
      } else {
        setStatus('Confirmed on Solana Testnet.');
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setStatus(message.includes('User rejected') ? 'Transaction cancelled in wallet.' : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white">Send & Receive — Solana Testnet</h3>
      <p className="mt-1 text-sm text-gray-400">
        QR requests use the Solana Pay URI format. Private keys stay in your wallet; native SOL sends use the Solana System Program.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <h4 className="font-semibold text-white">Receive funds</h4>
          <p className="mt-1 text-xs text-gray-400">Share this QR. Receiving itself does not create a transaction signature; the sender's payment does.</p>
          <div className="mt-3 grid gap-3">
            <input
              value={receiveAmount}
              onChange={(event) => setReceiveAmount(event.target.value)}
              placeholder="Optional SOL amount, e.g. 0.01"
              className="rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white"
            />
            <input
              value={receiveMemo}
              onChange={(event) => setReceiveMemo(event.target.value)}
              placeholder="Optional message"
              className="rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white"
            />
          </div>
          {qrImage && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <img src={qrImage} alt="Solana Testnet receive QR" className="h-64 w-64 rounded bg-white p-2" />
              <code className="w-full break-all rounded bg-gray-950 p-2 text-[11px] text-gray-400">{receiveUri}</code>
            </div>
          )}
          {!walletAddress && <p className="mt-3 text-sm text-yellow-300">Connect a wallet to generate a receive QR.</p>}
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <h4 className="font-semibold text-white">Give funds</h4>
          <p className="mt-1 text-xs text-gray-400">Upload a QR image or paste a Solana Pay URI, review it, then sign in your wallet.</p>
          <label className="mt-3 block cursor-pointer rounded border border-dashed border-gray-600 px-3 py-3 text-center text-sm text-gray-300 hover:border-purple-500">
            Scan QR image
            <input type="file" accept="image/*" onChange={scanImage} className="hidden" />
          </label>
          <textarea
            value={payPayload}
            onChange={(event) => setPayPayload(event.target.value)}
            placeholder="solana:<recipient>?amount=..."
            className="mt-3 min-h-24 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => parsePayload(payPayload)}
            className="mt-2 rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
          >
            Validate payment request
          </button>

          {parsed && (
            <div className="mt-4 space-y-1 rounded bg-gray-950 p-3 text-sm text-gray-300">
              <div>Recipient: <code className="break-all text-purple-300">{parsed.recipient}</code></div>
              <div>Amount: <strong>{parsed.amount || 'not specified'} SOL</strong></div>
              {parsed.message && <div>Message: {parsed.message}</div>}
            </div>
          )}

          <button
            type="button"
            disabled={!parsed || busy}
            onClick={sendPayment}
            className="mt-4 w-full rounded bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {busy ? 'Processing…' : 'Send with connected wallet'}
          </button>

          {status && <p className="mt-3 text-sm text-yellow-200">{status}</p>}
          {signature && (
            <a
              href={explorerTxUrl(signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all text-sm text-blue-300 underline"
            >
              Transaction signature: {signature}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
