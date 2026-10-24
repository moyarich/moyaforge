import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, resolve } from "node:path";

const packageRoot = resolve(import.meta.dirname, "../packages/moyaforge");
// --strict selects the existing failing audit policy; it is not a tarball path.
const args = process.argv.slice(2);
const unknownFlags = args.filter((arg) => arg.startsWith("-") && arg !== "--strict");
if (unknownFlags.length) throw new Error(`Unknown option: ${unknownFlags.join(", ")}`);
const paths = args.filter((arg) => arg !== "--strict");
if (paths.length > 1) throw new Error("Expected at most one tarball path");
let tarball = paths[0];
const temporary = tarball
  ? null
  : mkdtempSync(join(tmpdir(), "moyaforge-pack-"));
try {
  if (!tarball) {
    const filename = execFileSync(
      "npm",
      ["pack", "--ignore-scripts", "--silent", "--pack-destination", temporary],
      {
        cwd: packageRoot,
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .at(-1);
    tarball = join(temporary, filename);
  }
  // CI passes the tarball it has already packed and linted; do not pack twice.
  const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((path) => path.replace(/^package\//, ""));
  const entrySet = new Set(entries);
  const extractedUi = entries.filter(
    (path) =>
      (path.startsWith("dist/components/") ||
        path.startsWith("src/components/")) &&
      !path.startsWith("dist/components/Routing/") &&
      !path.startsWith("src/components/Routing/"),
  );
  const stylesheets = entries.filter((path) => path.endsWith(".css"));
  const sourceMaps = entries.filter((path) =>
    /\.(?:js|d\.ts)\.map$/.test(path),
  );
  const privateUi = entries.filter((path) => path.includes("moyaforge-ui"));
  const brokenCssImports = [];
  for (const stylesheet of stylesheets) {
    const css = execFileSync(
      "tar",
      ["-xOzf", tarball, `package/${stylesheet}`],
      { encoding: "utf8" },
    );
    for (const match of css.matchAll(
      /@import\s+(?:url\()?\s*["']([^"']+)["']/g,
    )) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      const target = posix.normalize(
        posix.join(posix.dirname(stylesheet), specifier),
      );
      if (!entrySet.has(target)) brokenCssImports.push({ stylesheet, target });
    }
  }
  const report = {
    tarball,
    totalFiles: entries.length,
    extractedUiFiles: extractedUi,
    stylesheetFiles: stylesheets,
    sourceMapFiles: sourceMaps,
    privateUiFiles: privateUi,
    brokenCssImports,
  };
  console.log(JSON.stringify(report, null, 2));
  // Public exports are checked by validate-package-exports; do not duplicate that validation here.
  if (
    extractedUi.length ||
    stylesheets.length ||
    sourceMaps.length ||
    privateUi.length ||
    brokenCssImports.length
  ) {
    console.error(
      "MoyaForge framework tarball contains forbidden files or broken CSS imports.",
    );
    process.exitCode = 1;
  }
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
