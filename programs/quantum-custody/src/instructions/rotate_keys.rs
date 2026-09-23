use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn handler(
    ctx: Context<crate::RotateKeys>,
    new_public_key: Vec<u8>,
    signature: Vec<u8>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    require!(
        new_public_key.len() == vault.algorithm.public_key_size(),
        QuantumCustodyError::InvalidPublicKeySize
    );
    
    require!(
        vault.algorithm.signature_size() > 0,
        QuantumCustodyError::UnsupportedOperation
    );

    require!(
        signature.len() == vault.algorithm.signature_size(),
        QuantumCustodyError::InvalidSignatureSize
    );
    
    vault.public_key = new_public_key.clone();
    vault.last_key_rotation = clock.unix_timestamp;
    
    // Signature length is checked, but cryptographic PQC verification is not
    // implemented on-chain; do not increase any readiness/compliance score.

    emit!(KeyRotatedEvent {
        vault: vault.key(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

#[event]
pub struct KeyRotatedEvent {
    pub vault: Pubkey,
    pub timestamp: i64,
}
