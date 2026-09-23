use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn handler(
    ctx: Context<crate::CreateVault>,
    algorithm: u8,
    public_key: Vec<u8>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    let crypto_algorithm = match algorithm {
        0 => CryptoAlgorithm::Dilithium2,
        1 => CryptoAlgorithm::Dilithium3,
        2 => CryptoAlgorithm::Dilithium5,
        3 => CryptoAlgorithm::SphincsSha2128s,
        4 => CryptoAlgorithm::SphincsSha2128f,
        5 => CryptoAlgorithm::SphincsShake128s,
        6 => CryptoAlgorithm::SphincsShake128f,
        7 => CryptoAlgorithm::Kyber512,
        8 => CryptoAlgorithm::Kyber768,
        9 => CryptoAlgorithm::Kyber1024,
        _ => return Err(QuantumCustodyError::InvalidAlgorithm.into()),
    };
    
    require!(
        public_key.len() == crypto_algorithm.public_key_size(),
        QuantumCustodyError::InvalidPublicKeySize
    );
    
    vault.owner = ctx.accounts.owner.key();
    vault.algorithm = crypto_algorithm;
    vault.public_key = public_key.clone();
    vault.created_at = clock.unix_timestamp;
    vault.last_key_rotation = clock.unix_timestamp;
    vault.transaction_count = 0;
    vault.compliance_status = ComplianceStatus::default();
    vault.bump = ctx.bumps.vault;
    
    // Selecting an algorithm does not prove FIPS compliance or constitute an audit.
    // Compliance/readiness fields remain at their conservative defaults until an
    // independently verified process explicitly establishes them.
    vault.compliance_status = ComplianceStatus::default();
    
    emit!(VaultCreatedEvent {
        vault: vault.key(),
        owner: vault.owner,
        algorithm: crypto_algorithm,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

#[event]
pub struct VaultCreatedEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub algorithm: CryptoAlgorithm,
    pub timestamp: i64,
}
