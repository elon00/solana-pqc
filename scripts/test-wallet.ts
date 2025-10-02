import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const USER_WALLET = '8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg';

async function testWallet() {
  console.log('🔍 Testing Solana Wallet...\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const publicKey = new PublicKey(USER_WALLET);

  try {
    const balance = await connection.getBalance(publicKey);
    console.log('✅ Wallet:', USER_WALLET);
    console.log('💰 Balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 5 });
    console.log('\n📝 Recent Transactions:', signatures.length);

    console.log('\n✨ Wallet test completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWallet();
