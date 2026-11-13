import { readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scriptFolders = ["scripts", "apps/playground/scripts"];
const legacy: string[] = [];

async function visit(folder: string): Promise<void> {
  for (const entry of await readdir(resolve(root, folder), { withFileTypes: true })) {
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) await visit(path);
    else if (entry.isFile() && /\.(?:mjs|cjs|js)$/.test(entry.name)) legacy.push(path);
  }
}

for (const folder of scriptFolders) await visit(folder);
if (legacy.length) {
  throw new Error(`Runtime scripts must be TypeScript:\n${legacy.join("\n")}`);
}
console.log("All runtime scripts use TypeScript.");
