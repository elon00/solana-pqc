import { Algorithm } from './types';

export class CryptoUtils {
  static getPublicKeySize(algorithm: Algorithm): number {
    const sizes: Record<Algorithm, number> = {
      [Algorithm.Dilithium2]: 1312,
      [Algorithm.Dilithium3]: 1952,
      [Algorithm.Dilithium5]: 2592,
      [Algorithm.SphincsSha2128s]: 32,
      [Algorithm.SphincsSha2128f]: 32,
      [Algorithm.SphincsShake128s]: 32,
      [Algorithm.SphincsShake128f]: 32,
      [Algorithm.Kyber512]: 800,
      [Algorithm.Kyber768]: 1184,
      [Algorithm.Kyber1024]: 1568,
    };
    return sizes[algorithm] || 0;
  }

  static getSignatureSize(algorithm: Algorithm): number {
    const sizes: Record<Algorithm, number> = {
      [Algorithm.Dilithium2]: 2420,
      [Algorithm.Dilithium3]: 3293,
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
      [Algorithm.Dilithium3]: 'CRYSTALS-Dilithium3 (NIST Level 3)',
      [Algorithm.Dilithium5]: 'CRYSTALS-Dilithium5 (NIST Level 5)',
      [Algorithm.SphincsSha2128s]: 'SPHINCS+-SHA2-128s',
      [Algorithm.SphincsSha2128f]: 'SPHINCS+-SHA2-128f',
      [Algorithm.SphincsShake128s]: 'SPHINCS+-SHAKE-128s',
      [Algorithm.SphincsShake128f]: 'SPHINCS+-SHAKE-128f',
      [Algorithm.Kyber512]: 'CRYSTALS-Kyber512 (NIST Level 1)',
      [Algorithm.Kyber768]: 'CRYSTALS-Kyber768 (NIST Level 3)',
      [Algorithm.Kyber1024]: 'CRYSTALS-Kyber1024 (NIST Level 5)',
    };
    return names[algorithm] || 'Unknown';
  }
}
