//! Solana Quantum-Safe Custody SDK
//! 
//! This SDK provides quantum-resistant cryptographic operations for Solana,
//! implementing NIST FIPS 203, 204, and 205 standards.

pub mod crypto;
pub mod vault;
pub mod transaction;
pub mod compliance;

pub use crypto::*;
pub use vault::*;
pub use transaction::*;
pub use compliance::*;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum SdkError {
    #[error("Cryptographic operation failed: {0}")]
    CryptoError(String),
    
    #[error("Invalid algorithm: {0}")]
    InvalidAlgorithm(String),
    
    #[error("Signature verification failed")]
    VerificationFailed,
    
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    
    #[error("Solana error: {0}")]
    SolanaError(#[from] solana_sdk::program_error::ProgramError),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Invalid public key size")]
    InvalidPublicKeySize,
    
    #[error("Invalid signature size")]
    InvalidSignatureSize,
}

pub type Result<T> = std::result::Result<T, SdkError>;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const NIST_FIPS_203_VERSION: &str = "1.0";
pub const NIST_FIPS_204_VERSION: &str = "1.0";
pub const NIST_FIPS_205_VERSION: &str = "1.0";
