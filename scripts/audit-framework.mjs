import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const scripts = [
  ["Framework source imports", "audit-framework-imports.mjs"],
  ["npm package contents", "audit-framework-pack.mjs"],
];
const args = process.argv.slice(2);
const failures = [];

for (const [label, script] of scripts) {
  console.log(`\n## ${label}`);
  const result = spawnSync(
    process.execPath,
    [resolve(import.meta.dirname, script), ...args],
    { stdio: "inherit" },
  );
  if (result.error) {
    console.error(`${label}: ${result.error.message}`);
    failures.push(label);
  } else if (result.status !== 0) {
    failures.push(label);
  }
}

if (failures.length) {
  console.error(`\nFramework audit failed: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("\nFramework audit passed.");
}
