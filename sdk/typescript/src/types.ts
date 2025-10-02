import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export enum Algorithm {
  Dilithium2 = 0,
  Dilithium3 = 1,
  Dilithium5 = 2,
  SphincsSha2128s = 3,
  SphincsSha2128f = 4,
  SphincsShake128s = 5,
  SphincsShake128f = 6,
  Kyber512 = 7,
  Kyber768 = 8,
  Kyber1024 = 9,
}

export interface QuantumVaultAccount {
  owner: PublicKey;
  algorithm: Algorithm;
  publicKey: Buffer;
  createdAt: BN;
  lastKeyRotation: BN;
  transactionCount: BN;
  complianceStatus: ComplianceStatus;
  bump: number;
}

export interface ComplianceStatus {
  nistFips203Compliant: boolean;
  nistFips204Compliant: boolean;
  nistFips205Compliant: boolean;
  lastAudit: BN;
  quantumReadinessScore: number;
}

export interface VaultConfig {
  algorithm: Algorithm;
  autoRotate?: boolean;
  rotationPeriod?: number;
}

export class QuantumCustodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuantumCustodyError';
  }
}
