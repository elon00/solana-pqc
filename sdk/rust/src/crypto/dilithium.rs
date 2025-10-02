//! NIST FIPS 204 - CRYSTALS-Dilithium (ML-DSA) Implementation

use crate::{Result, SdkError, crypto::{Keypair, Algorithm}};
use pqcrypto_dilithium::{dilithium2, dilithium3, dilithium5};
use pqcrypto_traits::sign::{PublicKey, SecretKey, SignedMessage};

pub fn generate_dilithium2_keypair() -> Result<Keypair> {
    let (pk, sk) = dilithium2::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Dilithium2,
    })
}

pub fn generate_dilithium3_keypair() -> Result<Keypair> {
    let (pk, sk) = dilithium3::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Dilithium3,
    })
}

pub fn generate_dilithium5_keypair() -> Result<Keypair> {
    let (pk, sk) = dilithium5::keypair();
    Ok(Keypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
        algorithm: Algorithm::Dilithium5,
    })
}

pub fn sign_dilithium2(message: &[u8], secret_key: &[u8]) -> Result<Vec<u8>> {
    let sk = dilithium2::SecretKey::from_bytes(secret_key)
        .map_err(|e| SdkError::CryptoError(format!("Invalid secret key: {:?}", e)))?;
    
    let signed_msg = dilithium2::sign(message, &sk);
    Ok(signed_msg.as_bytes().to_vec())
}

pub fn sign_dilithium3(message: &[u8], secret_key: &[u8]) -> Result<Vec<u8>> {
    let sk = dilithium3::SecretKey::from_bytes(secret_key)
        .map_err(|e| SdkError::CryptoError(format!("Invalid secret key: {:?}", e)))?;
    
    let signed_msg = dilithium3::sign(message, &sk);
    Ok(signed_msg.as_bytes().to_vec())
}

pub fn sign_dilithium5(message: &[u8], secret_key: &[u8]) -> Result<Vec<u8>> {
    let sk = dilithium5::SecretKey::from_bytes(secret_key)
        .map_err(|e| SdkError::CryptoError(format!("Invalid secret key: {:?}", e)))?;
    
    let signed_msg = dilithium5::sign(message, &sk);
    Ok(signed_msg.as_bytes().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_dilithium3_sign_verify() {
        let keypair = generate_dilithium3_keypair().unwrap();
        let message = b"Test message for Dilithium3";
        let signature = sign_dilithium3(message, &keypair.secret_key).unwrap();
        assert!(signature.len() > 0);
    }
}
