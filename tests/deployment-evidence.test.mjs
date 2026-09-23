import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { deploymentPayload, verifyEvidence, evidenceMarkdown } from '../scripts/write-testnet-evidence.mjs';

function fixture() {
  const custody = Keypair.generate().publicKey;
  const token = Keypair.generate().publicKey;
  const mint = Keypair.generate().publicKey;
  const owner = Keypair.generate().publicKey;
  const [global] = PublicKey.findProgramAddressSync([Buffer.from('global')], custody);
  const [info] = PublicKey.findProgramAddressSync([Buffer.from('token-info'), mint.toBuffer()], token);
  const env = {
    PROJECT_AUTHORITY: owner.toBase58(), QUANTUM_CUSTODY_PROGRAM_ID: custody.toBase58(),
    SPQC_TOKEN_PROGRAM_ID: token.toBase58(), SPQC_MINT: mint.toBase58(),
    SPQC_TOKEN_INFO: info.toBase58(), QUANTUM_CUSTODY_GLOBAL_STATE: global.toBase58(),
    QUANTUM_CUSTODY_DEPLOY_SIGNATURE: '2'.repeat(88), SPQC_TOKEN_DEPLOY_SIGNATURE: '3'.repeat(88),
    CUSTODY_INITIALIZE_SIGNATURE: '4'.repeat(88), TOKEN_INITIALIZE_SIGNATURE: '5'.repeat(88)
  };
  const data = Buffer.alloc(82);
  data.writeUInt32LE(1); owner.toBuffer().copy(data, 4); data[44] = 9; data[45] = 1;
  const accounts = [{ executable: true }, { executable: true },
    { owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), data },
    { owner: custody }, { owner: token }];
  const statuses = Array.from({ length: 4 }, () => ({ err: null, confirmationStatus: 'confirmed' }));
  const connection = { getGenesisHash: async () => 'testnet',
    getMultipleAccountsInfo: async () => accounts,
    getSignatureStatuses: async () => ({ value: statuses }) };
  return { env, accounts, statuses, connection, payload: deploymentPayload(env) };
}

test('complete evidence passes and Markdown preserves literal identifiers', async () => {
  const f = fixture();
  await verifyEvidence(f.payload, f.connection, f.connection);
  assert.ok(evidenceMarkdown(f.payload).includes('`' + f.env.SPQC_MINT + '`'));
});
test('missing values and shell text cannot become verified evidence', () => {
  const f = fixture();
  delete f.env.SPQC_MINT;
  assert.throws(() => deploymentPayload(f.env), /SPQC_MINT/);
  f.env.SPQC_MINT = '$(touch unsafe)';
  assert.throws(() => deploymentPayload(f.env), /SPQC_MINT/);
});
test('wrong network is rejected', async () => {
  const f = fixture();
  await assert.rejects(verifyEvidence(f.payload, f.connection, { getGenesisHash: async () => 'mainnet' }), /not Solana Testnet/);
});
test('wrong PDA is rejected', async () => {
  const f = fixture(); f.payload.tokenInfoPda = f.payload.spqcMint;
  await assert.rejects(verifyEvidence(f.payload, f.connection, f.connection), /PDA mismatch/);
});
for (const [name, mutate, error] of [
  ['missing account', f => { f.accounts[0] = null; }, /Missing deployed/],
  ['nonexecutable program', f => { f.accounts[0].executable = false; }, /not executable/],
  ['wrong PDA owner', f => { f.accounts[3].owner = new PublicKey(f.payload.spqcMint); }, /PDA owner/],
  ['wrong mint decimals', f => { f.accounts[2].data[44] = 6; }, /mint state/],
  ['wrong mint authority', f => { f.accounts[2].data.fill(0, 4, 36); }, /mint state/],
  ['failed transaction', f => { f.statuses[0].err = { InstructionError: [0, 'failure'] }; }, /transaction/],
  ['unconfirmed transaction', f => { f.statuses[0].confirmationStatus = 'processed'; }, /transaction/],
  ['missing transaction', f => { f.statuses[0] = null; }, /transaction/]
]) test(name + ' blocks verified record', async () => {
  const f = fixture(); mutate(f);
  await assert.rejects(verifyEvidence(f.payload, f.connection, f.connection), error);
});
