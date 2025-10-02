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
        signature.len() == vault.algorithm.signature_size(),
        QuantumCustodyError::InvalidSignatureSize
    );
    
    require!(
        message.len() <= 10_240,
        QuantumCustodyError::MessageTooLarge
    );
    
    vault.transaction_count = vault.transaction_count
        .checked_add(1)
        .ok_or(QuantumCustodyError::MathOverflow)?;
    
    emit!(TransactionSignedEvent {
        vault: vault.key(),
        transaction_count: vault.transaction_count,
        algorithm: vault.algorithm,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

#[event]
pub struct TransactionSignedEvent {
    pub vault: Pubkey,
    pub transaction_count: u64,
    pub algorithm: CryptoAlgorithm,
    pub timestamp: i64,
}
