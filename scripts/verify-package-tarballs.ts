import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = [
  "moyaforge",
  "moyaforge-cli",
  "moyaforge-mdx",
  "moyaforge-search-sqlite",
];

for (const name of packages) {
  const manifest = JSON.parse(
    readFileSync(resolve(root, "packages", name, "package.json"), "utf8"),
  );
  const result = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--workspace",
        manifest.name,
        "--dry-run",
        "--json",
        "--ignore-scripts",
      ],
      { cwd: root, encoding: "utf8" },
    ),
  );
  const pack = Array.isArray(result) ? result[0] : result[manifest.name];
  const files = new Set(pack.files.map(({ path }: { path: string }) => path));
  const exports = Object.values(manifest.exports ?? {}) as Record<
    string,
    string
  >[];
  const required = [
    "package.json",
    "README.md",
    "CHANGELOG.md",
    manifest.main,
    manifest.types,
    ...Object.values(manifest.bin ?? {}),
    ...exports.flatMap(Object.values),
  ] as string[];
  const missing = [...new Set(required)].filter(
    (path) => !files.has(path.replace(/^\.\//, "")),
  );
  if (missing.length) {
    throw new Error(
      `${manifest.name} package is missing: ${missing.join(", ")}`,
    );
  }
  console.log(`${manifest.name}: verified ${files.size} packaged files`);
}
