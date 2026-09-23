use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub total_vaults: u64,
    pub total_transactions: u64,
    pub bump: u8,
}

impl GlobalState {
    pub const SPACE: usize = 32 + 8 + 8 + 1;
}

#[account]
pub struct QuantumVault {
    pub owner: Pubkey,
    pub algorithm: CryptoAlgorithm,
    pub public_key: Vec<u8>,
    pub created_at: i64,
    pub last_key_rotation: i64,
    pub transaction_count: u64,
    pub compliance_status: ComplianceStatus,
    pub bump: u8,
}

impl QuantumVault {
    pub const SPACE: usize = 32 + 1 + 4 + 2592 + 8 + 8 + 8 + 32 + 1;
    
    pub fn is_key_rotation_required(&self, current_time: i64) -> bool {
        const ROTATION_PERIOD: i64 = 90 * 24 * 60 * 60;
        current_time.saturating_sub(self.last_key_rotation) > ROTATION_PERIOD
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CryptoAlgorithm {
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

impl CryptoAlgorithm {
    pub fn public_key_size(&self) -> usize {
        match self {
            CryptoAlgorithm::Dilithium2 => 1312,
            CryptoAlgorithm::Dilithium3 => 1952,
            CryptoAlgorithm::Dilithium5 => 2592,
            CryptoAlgorithm::SphincsSha2128s => 32,
            CryptoAlgorithm::SphincsSha2128f => 32,
            CryptoAlgorithm::SphincsShake128s => 32,
            CryptoAlgorithm::SphincsShake128f => 32,
            CryptoAlgorithm::Kyber512 => 800,
            CryptoAlgorithm::Kyber768 => 1184,
            CryptoAlgorithm::Kyber1024 => 1568,
        }
    }
    
    pub fn signature_size(&self) -> usize {
        match self {
            CryptoAlgorithm::Dilithium2 => 2420,
            CryptoAlgorithm::Dilithium3 => 3293,
            CryptoAlgorithm::Dilithium5 => 4595,
            CryptoAlgorithm::SphincsSha2128s => 7856,
            CryptoAlgorithm::SphincsSha2128f => 17088,
            CryptoAlgorithm::SphincsShake128s => 7856,
            CryptoAlgorithm::SphincsShake128f => 17088,
            _ => 0,
        }
    }
    
    pub fn security_level(&self) -> u8 {
        match self {
            CryptoAlgorithm::Dilithium2 | 
            CryptoAlgorithm::Kyber512 |
            CryptoAlgorithm::SphincsSha2128s |
            CryptoAlgorithm::SphincsSha2128f |
            CryptoAlgorithm::SphincsShake128s |
            CryptoAlgorithm::SphincsShake128f => 2,
            
            CryptoAlgorithm::Dilithium3 | 
            CryptoAlgorithm::Kyber768 => 3,
            
            CryptoAlgorithm::Dilithium5 | 
            CryptoAlgorithm::Kyber1024 => 5,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub struct ComplianceStatus {
    pub nist_fips_203_compliant: bool,
    pub nist_fips_204_compliant: bool,
    pub nist_fips_205_compliant: bool,
    pub last_audit: i64,
    pub quantum_readiness_score: u8,
}

impl Default for ComplianceStatus {
    fn default() -> Self {
        Self {
            nist_fips_203_compliant: false,
            nist_fips_204_compliant: false,
            nist_fips_205_compliant: false,
            last_audit: 0,
            quantum_readiness_score: 0,
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compliance_defaults_fail_closed() {
        let status = ComplianceStatus::default();
        assert!(!status.nist_fips_203_compliant);
        assert!(!status.nist_fips_204_compliant);
        assert!(!status.nist_fips_205_compliant);
        assert_eq!(status.last_audit, 0);
        assert_eq!(status.quantum_readiness_score, 0);
    }

    #[test]
    fn kem_algorithms_are_not_signature_algorithms() {
        assert_eq!(CryptoAlgorithm::Kyber512.signature_size(), 0);
        assert_eq!(CryptoAlgorithm::Kyber768.signature_size(), 0);
        assert_eq!(CryptoAlgorithm::Kyber1024.signature_size(), 0);
        assert!(CryptoAlgorithm::Dilithium3.signature_size() > 0);
    }

    #[test]
    fn rotation_check_handles_earlier_clock_without_underflow() {
        let vault = QuantumVault {
            owner: Pubkey::default(),
            algorithm: CryptoAlgorithm::Dilithium3,
            public_key: vec![0; CryptoAlgorithm::Dilithium3.public_key_size()],
            created_at: 100,
            last_key_rotation: 100,
            transaction_count: 0,
            compliance_status: ComplianceStatus::default(),
            bump: 0,
        };
        assert!(!vault.is_key_rotation_required(99));
        assert!(!vault.is_key_rotation_required(100));
    }
}
