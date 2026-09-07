import { Algorithm } from './types';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha256 } from '@noble/hashes/sha256.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import crypto from 'node:crypto';

export interface PQCKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface KEMCiphertext {
  cipherText: Uint8Array;
  sharedSecret: Uint8Array;
}

export class CryptoUtils {
  static getPublicKeySize(algorithm: Algorithm): number {
    const sizes: Record<Algorithm, number> = {
      [Algorithm.Dilithium2]: 1312,
      [Algorithm.Dilithium3]: 1952, // NIST FIPS 204 ML-DSA-65
      [Algorithm.Dilithium5]: 2592,
      [Algorithm.SphincsSha2128s]: 32,
      [Algorithm.SphincsSha2128f]: 32,
      [Algorithm.SphincsShake128s]: 32,
      [Algorithm.SphincsShake128f]: 32,
      [Algorithm.Kyber512]: 800,
      [Algorithm.Kyber768]: 1184, // NIST FIPS 203 ML-KEM-768
      [Algorithm.Kyber1024]: 1568,
    };
    return sizes[algorithm] || 0;
  }

  static getSignatureSize(algorithm: Algorithm): number {
    const sizes: Record<Algorithm, number> = {
      [Algorithm.Dilithium2]: 2420,
      [Algorithm.Dilithium3]: 3309, // NIST FIPS 204 ML-DSA-65 wire size
      [Algorithm.Dilithium5]: 4595,
      [Algorithm.SphincsSha2128s]: 7856,
      [Algorithm.SphincsSha2128f]: 17088,
      [Algorithm.SphincsShake128s]: 7856,
      [Algorithm.SphincsShake128f]: 17088,
      [Algorithm.Kyber512]: 0,
      [Algorithm.Kyber768]: 0,
      [Algorithm.Kyber1024]: 0,
    };
    return sizes[algorithm] || 0;
  }

  static getAlgorithmDisplayName(algorithm: Algorithm): string {
    const names: Record<Algorithm, string> = {
      [Algorithm.Dilithium2]: 'CRYSTALS-Dilithium2 (NIST Level 2)',
      [Algorithm.Dilithium3]: 'ML-DSA-65 / Crystals-Dilithium3 (NIST FIPS 204)',
      [Algorithm.Dilithium5]: 'CRYSTALS-Dilithium5 (NIST Level 5)',
      [Algorithm.SphincsSha2128s]: 'SPHINCS+-SHA2-128s',
      [Algorithm.SphincsSha2128f]: 'SPHINCS+-SHA2-128f',
      [Algorithm.SphincsShake128s]: 'SPHINCS+-SHAKE-128s',
      [Algorithm.SphincsShake128f]: 'SPHINCS+-SHAKE-128f',
      [Algorithm.Kyber512]: 'CRYSTALS-Kyber512 (NIST Level 1)',
      [Algorithm.Kyber768]: 'ML-KEM-768 / Crystals-Kyber768 (NIST FIPS 203)',
      [Algorithm.Kyber1024]: 'CRYSTALS-Kyber1024 (NIST Level 5)',
    };
    return names[algorithm] || 'Unknown';
  }

  // ---------------------------------------------------------------------------
  // REAL NIST FIPS 203 ML-KEM-768 EXECUTION
  // ---------------------------------------------------------------------------
  static generateKEMKeyPair(seed?: Uint8Array): PQCKeyPair {
    const seedFormatted = seed ? (seed.length === 64 ? seed : new Uint8Array(64).fill(0x23)) : undefined;
    const keyPair = seedFormatted ? ml_kem768.keygen(seedFormatted) : ml_kem768.keygen();
    return {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
    };
  }

  static encapsulateKEM(recipientPublicKey: Uint8Array): KEMCiphertext {
    if (recipientPublicKey.length !== 1184) {
      throw new Error(`Invalid ML-KEM-768 public key size: expected 1184, got ${recipientPublicKey.length}`);
    }
    const res = ml_kem768.encapsulate(recipientPublicKey);
    return {
      cipherText: res.cipherText,
      sharedSecret: res.sharedSecret,
    };
  }

  static decapsulateKEM(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
    if (ciphertext.length !== 1088) {
      throw new Error(`Invalid ML-KEM-768 ciphertext size: expected 1088, got ${ciphertext.length}`);
    }
    if (secretKey.length !== 2400) {
      throw new Error(`Invalid ML-KEM-768 secret key size: expected 2400, got ${secretKey.length}`);
    }
    return ml_kem768.decapsulate(ciphertext, secretKey);
  }

  // ---------------------------------------------------------------------------
  // REAL NIST FIPS 204 ML-DSA-65 EXECUTION
  // ---------------------------------------------------------------------------
  static generateDSAKeyPair(seed?: Uint8Array): PQCKeyPair {
    const seedFormatted = seed ? (seed.length === 32 ? seed : seed.slice(0, 32)) : undefined;
    const keyPair = seedFormatted ? ml_dsa65.keygen(seedFormatted) : ml_dsa65.keygen();
    return {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
    };
  }

  static signDSA(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
    if (secretKey.length !== 4032) {
      throw new Error(`Invalid ML-DSA-65 secret key size: expected 4032, got ${secretKey.length}`);
    }
    return ml_dsa65.sign(message, secretKey);
  }

  static verifyDSA(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
    if (publicKey.length !== 1952 || signature.length !== 3309) {
      return false;
    }
    try {
      return ml_dsa65.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // DUAL HYBRID CONJUNCTION: Solana Ed25519 ∧ NIST FIPS 204 ML-DSA-65
  // ---------------------------------------------------------------------------
  static verifySolanaHybridTransaction(
    solanaOwnerBytes: Uint8Array,
    ed25519Signature: Uint8Array,
    mlDsaPublicKey: Uint8Array,
    mlDsaSignature: Uint8Array,
    message: Uint8Array
  ): boolean {
    // 1. Classical Ed25519 Signature Verification
    let ed25519Ok = false;
    try {
      const derPrefix = Buffer.from('302a300506032b6570032100', 'hex');
      const derKey = Buffer.concat([derPrefix, Buffer.from(solanaOwnerBytes)]);
      const keyObj = crypto.createPublicKey({ key: derKey, format: 'der', type: 'spki' });
      ed25519Ok = crypto.verify(null, message, keyObj, ed25519Signature);
    } catch {
      ed25519Ok = false;
    }

    if (!ed25519Ok) {
      return false;
    }

    // 2. Post-Quantum Lattice ML-DSA-65 Signature Verification
    const pqcOk = this.verifyDSA(mlDsaSignature, message, mlDsaPublicKey);
    if (!pqcOk) {
      return false; // Fail-Closed
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // PQC Commitment Derivation for Solana PDA Anchoring
  // ---------------------------------------------------------------------------
  static deriveQuantumCommitment(pqcPublicKey: Uint8Array): Buffer {
    return Buffer.from(sha256(pqcPublicKey));
  }
}
