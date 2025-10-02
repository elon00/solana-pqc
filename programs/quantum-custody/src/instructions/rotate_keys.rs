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
        signature.len() == vault.algorithm.signature_size(),
        QuantumCustodyError::InvalidSignatureSize
    );
    
    vault.public_key = new_public_key.clone();
    vault.last_key_rotation = clock.unix_timestamp;
    
    vault.compliance_status.quantum_readiness_score = 
        vault.compliance_status.quantum_readiness_score.saturating_add(5).min(100);
    
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
