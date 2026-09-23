use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn handler(
    ctx: Context<crate::SignTransaction>,
    message: Vec<u8>,
    signature: Vec<u8>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    require!(
        !vault.is_key_rotation_required(clock.unix_timestamp),
        QuantumCustodyError::KeyRotationRequired
    );
    
    require!(
        vault.algorithm.signature_size() > 0,
        QuantumCustodyError::UnsupportedOperation
    );

    require!(
        signature.len() == vault.algorithm.signature_size(),
        QuantumCustodyError::InvalidSignatureSize
    );
    
    require!(
        message.len() <= 10_240,
        QuantumCustodyError::MessageTooLarge
    );
    
    // Fail closed: this program currently validates metadata/lengths only.
    // It must not record a transaction as signed until cryptographic PQC
    // verification is implemented on-chain.
    return err!(QuantumCustodyError::PqcVerificationUnavailable);
}

#[event]
pub struct TransactionSignedEvent {
    pub vault: Pubkey,
    pub transaction_count: u64,
    pub algorithm: CryptoAlgorithm,
    pub timestamp: i64,
}
