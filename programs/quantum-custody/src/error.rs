use anchor_lang::prelude::*;

#[error_code]
pub enum QuantumCustodyError {
    #[msg("Invalid cryptographic algorithm specified")]
    InvalidAlgorithm,
    
    #[msg("Public key size does not match algorithm requirements")]
    InvalidPublicKeySize,
    
    #[msg("Signature size does not match algorithm requirements")]
    InvalidSignatureSize,
    
    #[msg("Signature verification failed")]
    SignatureVerificationFailed,
    
    #[msg("Key rotation is required before performing this operation")]
    KeyRotationRequired,
    
    #[msg("Unauthorized access attempt")]
    Unauthorized,
    
    #[msg("Vault is not compliant with required standards")]
    ComplianceViolation,
    
    #[msg("Message exceeds maximum allowed size")]
    MessageTooLarge,
    
    #[msg("Invalid compliance data provided")]
    InvalidComplianceData,
    
    #[msg("Quantum readiness score below minimum threshold")]
    InsufficientQuantumReadiness,
    
    #[msg("Algorithm not supported for this operation")]
    UnsupportedOperation,
    
    #[msg("Vault already initialized")]
    VaultAlreadyInitialized,
    
    #[msg("Mathematical overflow occurred")]
    MathOverflow,
}
