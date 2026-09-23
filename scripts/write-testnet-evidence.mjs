import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Connection, PublicKey } from '@solana/web3.js';

const fields = {
  quantumCustodyProgramId: 'QUANTUM_CUSTODY_PROGRAM_ID',
  spqcTokenProgramId: 'SPQC_TOKEN_PROGRAM_ID',
  spqcMint: 'SPQC_MINT',
  tokenInfoPda: 'SPQC_TOKEN_INFO',
  custodyGlobalStatePda: 'QUANTUM_CUSTODY_GLOBAL_STATE',
  quantumCustodyDeploySignature: 'QUANTUM_CUSTODY_DEPLOY_SIGNATURE',
  spqcTokenDeploySignature: 'SPQC_TOKEN_DEPLOY_SIGNATURE',
  custodyInitializeSignature: 'CUSTODY_INITIALIZE_SIGNATURE',
  tokenInitializeSignature: 'TOKEN_INITIALIZE_SIGNATURE'
};

export function deploymentPayload(env) {
  const payload = { status: 'verified', network: 'testnet' };
  for (const [field, key] of Object.entries(fields)) {
    const value = env[key];
    if (typeof value !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) {
      throw new Error(`Missing or invalid ${key}`);
    }
    if (field.endsWith('Signature')) {
      if (value.length < 64 || value.length > 88) throw new Error(`Invalid ${key}`);
    } else {
      new PublicKey(value);
    }
    payload[field] = value;
  }
  payload.projectAuthority = new PublicKey(env.PROJECT_AUTHORITY).toBase58();
  payload.verifiedAt = new Date().toISOString();
  return payload;
}

export async function verifyEvidence(payload, connection, testnetConnection) {
  const [actual, expected] = await Promise.all([
    connection.getGenesisHash(), testnetConnection.getGenesisHash()
  ]);
  if (actual !== expected) throw new Error('RPC is not Solana Testnet');
  const custody = new PublicKey(payload.quantumCustodyProgramId);
  const token = new PublicKey(payload.spqcTokenProgramId);
  const mint = new PublicKey(payload.spqcMint);
  const [global] = PublicKey.findProgramAddressSync([Buffer.from('global')], custody);
  const [info] = PublicKey.findProgramAddressSync([Buffer.from('token-info'), mint.toBuffer()], token);
  if (global.toBase58() !== payload.custodyGlobalStatePda || info.toBase58() !== payload.tokenInfoPda) {
    throw new Error('Deployment PDA mismatch');
  }
  const accounts = await connection.getMultipleAccountsInfo([custody, token, mint, global, info], 'confirmed');
  if (accounts.some(account => !account)) throw new Error('Missing deployed account');
  if (!accounts[0].executable || !accounts[1].executable) throw new Error('Program is not executable');
  if (!accounts[3].owner.equals(custody) || !accounts[4].owner.equals(token)) throw new Error('PDA owner mismatch');
  const mintAccount = accounts[2];
  if (!mintAccount.owner.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) ||
      mintAccount.data.length !== 82 || mintAccount.data[44] !== 9 || mintAccount.data[45] !== 1 ||
      mintAccount.data.readUInt32LE(0) !== 1 ||
      !new PublicKey(mintAccount.data.subarray(4, 36)).equals(new PublicKey(payload.projectAuthority))) {
    throw new Error('SPQC mint state or authority mismatch');
  }
  const signatures = Object.keys(fields).filter(key => key.endsWith('Signature')).map(key => payload[key]);
  const result = await connection.getSignatureStatuses(signatures, { searchTransactionHistory: true });
  if (result.value.length !== signatures.length || result.value.some(status =>
    !status || status.err !== null || !['confirmed', 'finalized'].includes(status.confirmationStatus))) {
    throw new Error('Deployment transaction is missing, failed, or unconfirmed');
  }
}

export function evidenceMarkdown(payload) {
  return '# SCSTOBCMinority AI — Solana Testnet Deployment\n\n' +
    '**Status:** VERIFIED ON-CHAIN\n**Network:** Solana Testnet\n\n' +
    Object.entries(payload).map(([key, value]) => `- **${key}:** \`${value}\``).join('\n') +
    '\n\nSPQC uses uncapped application-level minting; raw SPL Token accounting is bounded by `u64`.\n' +
    'This deployment evidence does not establish independent audit, on-chain PQC verification, or Mainnet readiness.\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = deploymentPayload(process.env);
  await verifyEvidence(payload,
    new Connection(process.env.SOLANA_URL || 'https://api.testnet.solana.com', 'confirmed'),
    new Connection('https://api.testnet.solana.com', 'confirmed'));
  const content = JSON.stringify(payload, null, 2) + '\n';
  fs.mkdirSync('app/public', { recursive: true });
  fs.writeFileSync('backend/testnet-deployment.json', content);
  fs.writeFileSync('app/public/testnet-deployment.json', content);
  fs.writeFileSync('TESTNET_DEPLOYMENT.md', evidenceMarkdown(payload));
}
