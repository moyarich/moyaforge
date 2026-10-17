import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";

const projectRoot = resolve(import.meta.dirname, "../../..");
const supported = new Set([".js", ".jsx", ".ts", ".tsx", ".md", ".mdx", ".mjs"]);
const ignored = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const legacy = /@moyarich\/moyaforge\/(?:docs|mdx|code)(?![\w/-])/g;
const violations = [];

async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = resolve(folder, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
    } else if (entry.isFile() && supported.has(extname(entry.name))) {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(legacy)) {
        const line = source.slice(0, match.index).split("\n").length;
        violations.push(`${relative(projectRoot, file)}:${line}: ${match[0]}`);
      }
    }
  }
}
for (const folder of ["apps/playground", "docs"]) {
  const target = resolve(projectRoot, folder);
  try { await walk(target); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
if (violations.length) {
  console.error("References to removed framework exports:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("No imports of removed framework UI/MDX subpaths found.");
}
