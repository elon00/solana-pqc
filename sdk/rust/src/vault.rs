//! Quantum-safe vault management

use crate::{Result, crypto::Algorithm};
use solana_sdk::pubkey::Pubkey;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumVault {
    pub address: Pubkey,
    pub owner: Pubkey,
    pub algorithm: Algorithm,
    pub public_key: Vec<u8>,
    pub created_at: i64,
    pub last_key_rotation: i64,
    pub transaction_count: u64,
}

impl QuantumVault {
    pub fn is_key_rotation_required(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        const ROTATION_PERIOD: i64 = 90 * 24 * 60 * 60;
        now - self.last_key_rotation > ROTATION_PERIOD
    }
}
