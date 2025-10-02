pub mod kyber;
pub mod dilithium;
pub mod sphincs;

use crate::{Result, SdkError};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Algorithm {
    Dilithium2,
    Dilithium3,
    Dilithium5,
    SphincsSha2128s,
    SphincsSha2128f,
    SphincsShake128s,
    SphincsShake128f,
    Kyber512,
    Kyber768,
    Kyber1024,
}

impl Algorithm {
    pub fn to_u8(&self) -> u8 {
        match self {
            Algorithm::Dilithium2 => 0,
            Algorithm::Dilithium3 => 1,
            Algorithm::Dilithium5 => 2,
            Algorithm::SphincsSha2128s => 3,
            Algorithm::SphincsSha2128f => 4,
            Algorithm::SphincsShake128s => 5,
            Algorithm::SphincsShake128f => 6,
            Algorithm::Kyber512 => 7,
            Algorithm::Kyber768 => 8,
            Algorithm::Kyber1024 => 9,
        }
    }
    
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(Algorithm::Dilithium2),
            1 => Ok(Algorithm::Dilithium3),
            2 => Ok(Algorithm::Dilithium5),
            3 => Ok(Algorithm::SphincsSha2128s),
            4 => Ok(Algorithm::SphincsSha2128f),
            5 => Ok(Algorithm::SphincsShake128s),
            6 => Ok(Algorithm::SphincsShake128f),
            7 => Ok(Algorithm::Kyber512),
            8 => Ok(Algorithm::Kyber768),
            9 => Ok(Algorithm::Kyber1024),
            _ => Err(SdkError::InvalidAlgorithm(format!("Unknown algorithm: {}", value))),
        }
    }
    
    pub fn security_level(&self) -> u8 {
        match self {
            Algorithm::Dilithium2 | Algorithm::Kyber512 | 
            Algorithm::SphincsSha2128s | Algorithm::SphincsSha2128f |
            Algorithm::SphincsShake128s | Algorithm::SphincsShake128f => 2,
            
            Algorithm::Dilithium3 | Algorithm::Kyber768 => 3,
            
            Algorithm::Dilithium5 | Algorithm::Kyber1024 => 5,
        }
    }
}

#[derive(Clone, Zeroize)]
#[zeroize(drop)]
pub struct Keypair {
    pub public_key: Vec<u8>,
    pub secret_key: Vec<u8>,
    pub algorithm: Algorithm,
}

impl Keypair {
    pub fn generate(algorithm: Algorithm) -> Result<Self> {
        match algorithm {
            Algorithm::Dilithium2 => dilithium::generate_dilithium2_keypair(),
            Algorithm::Dilithium3 => dilithium::generate_dilithium3_keypair(),
            Algorithm::Dilithium5 => dilithium::generate_dilithium5_keypair(),
            Algorithm::Kyber512 => kyber::generate_kyber512_keypair(),
            Algorithm::Kyber768 => kyber::generate_kyber768_keypair(),
            Algorithm::Kyber1024 => kyber::generate_kyber1024_keypair(),
            _ => Err(SdkError::CryptoError("Algorithm not yet implemented".to_string())),
        }
    }
    
    pub fn sign(&self, message: &[u8]) -> Result<Vec<u8>> {
        match self.algorithm {
            Algorithm::Dilithium2 => dilithium::sign_dilithium2(message, &self.secret_key),
            Algorithm::Dilithium3 => dilithium::sign_dilithium3(message, &self.secret_key),
            Algorithm::Dilithium5 => dilithium::sign_dilithium5(message, &self.secret_key),
            _ => Err(SdkError::CryptoError("Algorithm does not support signing".to_string())),
        }
    }
}
