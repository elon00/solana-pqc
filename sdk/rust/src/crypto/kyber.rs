//! NIST FIPS 203 - CRYSTALS-Kyber (ML-KEM) Implementation

use crate::{Result, SdkError, crypto::{Keypair, Algorithm}};
use pqcrypto_kyber::{kyber512, kyber768, kyber1024};
use pqcrypto_traits::kem::{PublicKey, SecretKey};

pub fn generate_kyber512_keypair() -> Result<Keypair> {
    let (pk, sk) = kyber512::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Kyber512,
    })
}

pub fn generate_kyber768_keypair() -> Result<Keypair> {
    let (pk, sk) = kyber768::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Kyber768,
    })
}

pub fn generate_kyber1024_keypair() -> Result<Keypair> {
    let (pk, sk) = kyber1024::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Kyber1024,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_kyber768_keypair() {
        let keypair = generate_kyber768_keypair().unwrap();
        assert_eq!(keypair.public_key.len(), 1184);
    }
}
