import fs from "node:fs";

const path = new URL("../testnet-deployment.json", import.meta.url);

export function readTestnetDeployment() {
  try {
    const raw = fs.readFileSync(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      status: "pending",
      network: "testnet",
      quantumCustodyProgramId: null,
      spqcTokenProgramId: null,
      spqcMint: null
    };
  }
}
