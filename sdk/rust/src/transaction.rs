//! Quantum-safe transaction signing

use crate::{Result, crypto::Keypair};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumSignedTransaction {
    pub transaction: Vec<u8>,
    pub quantum_signature: Vec<u8>,
    pub algorithm: u8,
    pub timestamp: i64,
}

impl QuantumSignedTransaction {
    pub fn new(transaction: &[u8], keypair: &Keypair) -> Result<Self> {
        let signature = keypair.sign(transaction)?;
        
        Ok(Self {
            transaction: transaction.to_vec(),
            quantum_signature: signature,
            algorithm: keypair.algorithm.to_u8(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
        })
    }
}
