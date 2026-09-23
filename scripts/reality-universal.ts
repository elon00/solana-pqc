/**
 * Deprecated compatibility entrypoint.
 *
 * The former URS 10/10 self-certification has been retired because an internal
 * automated score is not independent security evidence.
 *
 * Use: npm run reality:audit
 */
import { spawnSync } from "node:child_process";

console.warn("URS self-certification is deprecated. Running evidence-based reality audit instead.");
const result = spawnSync(process.execPath, ["scripts/reality-audit.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);
