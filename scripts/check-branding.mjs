#!/usr/bin/env node
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const canonical = "SCSTOBCMinority AI";
const legacyPattern = new RegExp(["solana", "pqc"].join("[\\s_-]+"), "i");
const textExtensions = new Set([
  ".md", ".txt", ".json", ".toml", ".yml", ".yaml", ".html", ".css",
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".rs", ".sh", ".bat", ".ps1"
]);
const skip = new Set([
  "package-lock.json",
  "app/package-lock.json",
  "backend/package-lock.json",
  "sdk/typescript/package-lock.json"
]);

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const violations = [];
for (const file of files) {
  if (skip.has(file) || file === "scripts/check-branding.mjs") continue;
  const dot = file.lastIndexOf(".");
  const ext = dot >= 0 ? file.slice(dot) : "";
  const isEnvFile = file === ".env" || file.startsWith(".env.");
  if (!textExtensions.has(ext) && !isEnvFile) continue;
  const content = fs.readFileSync(file, "utf8");
  const match = content.match(legacyPattern);
  if (match) violations.push({ file, value: match[0] });
}

const required = [
  "README.md",
  "app/index.html",
  "app/src/config.ts",
  ".github/workflows/pages.yml"
];
for (const file of required) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes(canonical)) {
    violations.push({ file, value: "canonical brand missing" });
  }
}

if (violations.length) {
  console.error("Branding guard failed.");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.value}`);
  }
  process.exit(1);
}

console.log(`Branding guard passed: ${canonical}`);
