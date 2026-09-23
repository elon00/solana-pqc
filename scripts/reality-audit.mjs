#!/usr/bin/env node
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const exists = (file) => fs.existsSync(file);
const json = (file) => JSON.parse(read(file));

const deployment = json("backend/testnet-deployment.json");
const manifest = json("REALITY_MANIFEST.json");
const readme = read("README.md");
const security = read("SECURITY.md");
const token = read("programs/token/src/lib.rs");
const custodySign = read("programs/quantum-custody/src/instructions/sign_transaction.rs");
const appPackage = json("app/package.json");

const checks = [];
const add = (name, weight, earned, evidence, blocking = false) =>
  checks.push({ name, weight, earned, evidence, blocking });

add(
  "Canonical identity and truth guard",
  8,
  exists("scripts/check-branding.mjs") && manifest.system === "SCSTOBCMinority AI" ? 8 : 0,
  "Brand guard + REALITY_MANIFEST system name"
);
add(
  "Frontend / wallet integration",
  12,
  exists("app/src/context/BackendWalletContext.tsx") && exists("app/src/components/PaymentPanel.tsx") ? 12 : 5,
  "Phantom/Solflare app, backend wallet context, payment panel"
);
add(
  "Backend API and wallet authentication",
  12,
  exists("backend/src/auth.mjs") && exists("netlify/functions/api.mjs") ? 12 : 5,
  "Stateless Ed25519 wallet auth + Node/Netlify API"
);
add(
  "Send / receive payment implementation",
  10,
  exists("backend/src/payments.mjs") &&
    appPackage.dependencies?.qrcode &&
    appPackage.dependencies?.jsqr &&
    exists("app/src/components/PaymentPanel.tsx") ? 10 : 3,
  "Solana Pay QR generation/parsing + wallet-signed native SOL transfer"
);
add(
  "Automated payment tests",
  8,
  read("backend/test/backend.test.mjs").includes("Solana Pay request round-trips") ? 8 : 0,
  "Backend payment boundary tests"
);
add(
  "Smart-contract defensive constraints",
  12,
  token.includes("SupplyUnderflow") &&
    token.includes("quantum_verified_on_chain: false") ? 9 : 5,
  "Checked arithmetic + mint constraints; PQC evidence explicitly not verified on-chain"
);
add(
  "On-chain PQC verification",
  8,
  1,
  custodySign.includes("PqcVerificationUnavailable")
    ? "Custody signing fails closed because cryptographic PQC verification is not implemented on-chain"
    : "Cryptographic PQC verification is not established on-chain",
  true
);
const requiredDeploymentEvidence = manifest.deploymentEvidence?.requiredForVerifiedStatus || [];
const completeDeploymentEvidence =
  deployment.status === "verified" &&
  requiredDeploymentEvidence.length > 0 &&
  requiredDeploymentEvidence.every((field) => Boolean(deployment[field]));

add(
  "Verified Testnet deployment evidence",
  15,
  completeDeploymentEvidence ? 15 : 0,
  completeDeploymentEvidence
    ? "Machine deployment record contains every required program/mint/PDA/deployment/init signature field"
    : "Deployment evidence is incomplete; every manifest-required field must be recorded before verified status",
  true
);
add(
  "Independent security assurance",
  10,
  security.includes("has not completed an independent professional") ? 3 : 0,
  "No independent professional audit/pentest/formal verification recorded",
  true
);
add(
  "Documentation honesty",
  5,
  !readme.includes("$1,000,000 SPQC") &&
    readme.toLowerCase().includes("verified on-chain testnet deployment") ? 5 : 2,
  "README distinguishes implemented, pending, and release-gated items"
);

const score = checks.reduce((sum, item) => sum + item.earned, 0);
const maxScore = checks.reduce((sum, item) => sum + item.weight, 0);
const percentage = Math.round((score / maxScore) * 100);
const grade =
  percentage >= 93 ? "A" :
  percentage >= 90 ? "A-" :
  percentage >= 87 ? "B+" :
  percentage >= 83 ? "B" :
  percentage >= 80 ? "B-" :
  percentage >= 77 ? "C+" :
  percentage >= 73 ? "C" :
  percentage >= 70 ? "C-" :
  percentage >= 67 ? "D+" :
  percentage >= 63 ? "D" :
  percentage >= 60 ? "D-" : "F";

const blockers = checks.filter((item) => item.blocking && item.earned < item.weight)
  .map((item) => item.name);

const gradeFor = (value) =>
  value >= 93 ? "A" :
  value >= 90 ? "A-" :
  value >= 87 ? "B+" :
  value >= 83 ? "B" :
  value >= 80 ? "B-" :
  value >= 77 ? "C+" :
  value >= 73 ? "C" :
  value >= 70 ? "C-" :
  value >= 67 ? "D+" :
  value >= 63 ? "D" :
  value >= 60 ? "D-" : "F";

const engineeringNames = new Set([
  "Canonical identity and truth guard",
  "Frontend / wallet integration",
  "Backend API and wallet authentication",
  "Send / receive payment implementation",
  "Automated payment tests",
  "Smart-contract defensive constraints",
  "On-chain PQC verification",
  "Documentation honesty"
]);
const engineeringChecks = checks.filter((item) => engineeringNames.has(item.name));
const engineeringScore = Math.round(
  engineeringChecks.reduce((sum, item) => sum + item.earned, 0) /
  engineeringChecks.reduce((sum, item) => sum + item.weight, 0) * 100
);
const releaseChecks = checks.filter((item) => !engineeringNames.has(item.name));
const releaseAssuranceScore = Math.round(
  releaseChecks.reduce((sum, item) => sum + item.earned, 0) /
  releaseChecks.reduce((sum, item) => sum + item.weight, 0) * 100
);

const report = {
  system: "SCSTOBCMinority AI",
  generatedAt: new Date().toISOString(),
  score: percentage,
  grade,
  engineeringImplementationScore: engineeringScore,
  engineeringImplementationGrade: gradeFor(engineeringScore),
  releaseAssuranceScore,
  releaseAssuranceGrade: gradeFor(releaseAssuranceScore),
  releaseStatus: blockers.length ? "NOT_MAINNET_READY" : "RELEASE_GATES_PASSED",
  deploymentStatus: deployment.status,
  checks,
  blockers,
  note: "This is an internal evidence score, not a security certification or regulatory approval."
};

fs.mkdirSync("reality", { recursive: true });
fs.writeFileSync("reality/REALITY_SCORECARD.json", JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
