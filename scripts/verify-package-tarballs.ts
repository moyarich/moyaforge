import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = [
  "moyaforge",
  "moyaforge-cli",
  "moyaforge-mdx",
  "moyaforge-search-sqlite",
];

const temp = mkdtempSync(join(tmpdir(), "moyaforge-package-exports-"));
try {
  for (const name of packages) {
    const manifest = JSON.parse(
      readFileSync(join(root, "packages", name, "package.json"), "utf8"),
    );
    const tarballName = execFileSync(
      "npm",
      [
        "pack",
        "--workspace",
        manifest.name,
        "--ignore-scripts",
        "--silent",
        "--pack-destination",
        temp,
      ],
      { cwd: root, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .at(-1);
    const tarball = join(temp, tarballName);
    const files = new Set(
      execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
        .split("\n")
        .filter(Boolean)
        .map((path) => path.replace(/^package\//, "")),
    );
    const missing: string[] = [];
    const requireFile = (path: string) => {
      if (!files.has(path.replace(/^\.\//, ""))) missing.push(path);
    };

    for (const entry of Object.values(manifest.exports ?? {}) as Array<{types: string; import: string; default: string}>) {
      if (typeof entry !== "object" || entry === null) {
        throw new Error(`${manifest.name} has an unexpected export entry`);
      }
      requireFile(entry.types);
      requireFile(entry.import);
      if (entry.default !== entry.import) {
        throw new Error(`${manifest.name} default export differs from import`);
      }
    }
    for (const path of Object.values(manifest.bin ?? {})) requireFile(path);
    requireFile(manifest.main);
    requireFile(manifest.types);
    requireFile("package.json");
    requireFile("README.md");
    requireFile("CHANGELOG.md");

    if (missing.length) {
      throw new Error(
        `${manifest.name} tarball is missing declared files: ${missing.join(", ")}`,
      );
    }
    console.log(
      `${manifest.name}: verified ${files.size} packaged files and public exports`,
    );
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
