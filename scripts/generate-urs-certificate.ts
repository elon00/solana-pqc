/**
 * Deprecated compatibility entrypoint.
 *
 * No self-issued security certificate is generated. Run the evidence-based
 * reality audit and use independent professional review for security assurance.
 */
import { spawnSync } from "node:child_process";

console.warn("Self-issued URS certificates are deprecated. Running reality audit instead.");
const result = spawnSync(process.execPath, ["scripts/reality-audit.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);
