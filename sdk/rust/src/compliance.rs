//! Compliance tracking and reporting

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceReport {
    pub organization: String,
    pub report_date: i64,
    pub overall_score: u8,
    pub nist_fips_203_compliant: bool,
    pub nist_fips_204_compliant: bool,
    pub nist_fips_205_compliant: bool,
    pub recommendations: Vec<String>,
}

impl ComplianceReport {
    pub fn new(organization: String) -> Self {
        Self {
            organization,
            report_date: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
            overall_score: 0,
            nist_fips_203_compliant: false,
            nist_fips_204_compliant: false,
            nist_fips_205_compliant: false,
            recommendations: Vec::new(),
        }
    }
    
    pub fn export_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}
