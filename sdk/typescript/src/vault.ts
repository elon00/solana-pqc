import { PublicKey } from '@solana/web3.js';
import { Algorithm, QuantumVaultAccount } from './types';

export class QuantumVault {
  public address: PublicKey;
  public owner: PublicKey;
  public algorithm: Algorithm;
  public publicKey: Buffer;
  public createdAt: Date;
  public lastKeyRotation: Date;
  public transactionCount: number;

  constructor(account: QuantumVaultAccount, address: PublicKey) {
    this.address = address;
    this.owner = account.owner;
    this.algorithm = account.algorithm;
    this.publicKey = Buffer.from(account.publicKey);
    this.createdAt = new Date(account.createdAt.toNumber() * 1000);
    this.lastKeyRotation = new Date(account.lastKeyRotation.toNumber() * 1000);
    this.transactionCount = account.transactionCount.toNumber();
  }

  isKeyRotationRequired(): boolean {
    const now = Date.now();
    const rotationPeriod = 90 * 24 * 60 * 60 * 1000;
    return now - this.lastKeyRotation.getTime() > rotationPeriod;
  }

  getAlgorithmName(): string {
    return Algorithm[this.algorithm];
  }
}
