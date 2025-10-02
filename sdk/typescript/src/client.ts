import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Algorithm, QuantumVaultAccount, VaultConfig } from './types';

export class QuantumVaultClient {
  private program: Program;
  private connection: Connection;
  private provider: AnchorProvider;

  constructor(connection: Connection, wallet: any, programId: PublicKey, idl: Idl) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    this.program = new Program(idl, programId, this.provider);
  }

  async initialize(authority: PublicKey): Promise<string> {
    const [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global')],
      this.program.programId
    );

    const tx = await this.program.methods
      .initialize(authority)
      .accounts({
        globalState: globalStatePda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async createVault(config: VaultConfig, publicKey: Buffer): Promise<PublicKey> {
    const owner = this.provider.wallet.publicKey;
    
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      this.program.programId
    );

    await this.program.methods
      .createVault(config.algorithm, Array.from(publicKey))
      .accounts({
        vault: vaultPda,
        owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return vaultPda;
  }

  async getVault(vaultAddress: PublicKey): Promise<QuantumVaultAccount> {
    const account = await this.program.account.quantumVault.fetch(vaultAddress);
    return account as QuantumVaultAccount;
  }

  getVaultAddress(owner: PublicKey): PublicKey {
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      this.program.programId
    );
    return vaultPda;
  }
}
