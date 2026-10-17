import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = resolve(root, "packages/moyaforge");
const manifest = JSON.parse(
  await readFile(resolve(pkg, "package.json"), "utf8"),
);
const output = execFileSync(
  "npm",
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  {
    cwd: pkg,
    encoding: "utf8",
  },
);
const [pack] = JSON.parse(output);
const paths = pack.files.map((entry) => entry.path);
const legacyComponentPaths = paths.filter(
  (path) =>
    path.startsWith("dist/components/") || path.startsWith("src/components/"),
);
// Routing is framework infrastructure, not installable UI. Only flag UI
// implementations that must be removed after consumer migration.
const packedExtractedUi = legacyComponentPaths.filter(
  (path) =>
    !path.startsWith("dist/components/Routing/") &&
    !path.startsWith("src/components/Routing/"),
);
const stylesheetPaths = paths.filter((path) => path.endsWith(".css"));
const sourceMaps = paths.filter(
  (path) => path.endsWith(".js.map") || path.endsWith(".d.ts.map"),
);
const uiOnlyPaths = paths.filter((path) => path.includes("moyaforge-ui"));
// npm's files allowlist does not guarantee that every public export target
// survives packing. Check both the JS and declaration targets before release.
const exportTargets = Object.entries(manifest.exports ?? {}).flatMap(
  ([subpath, declaration]) => {
    const targets =
      typeof declaration === "string"
        ? [declaration]
        : Object.values(declaration).filter(
            (value) => typeof value === "string",
          );
    return targets.map((target) => ({
      subpath,
      target: target.replace(/^\.\//, ""),
    }));
  },
);
const missingExports = exportTargets.filter(
  ({ target }) => !paths.includes(target),
);
const packedSet = new Set(paths);
const brokenCssImports = [];
for (const stylesheet of stylesheetPaths) {
  const css = await readFile(resolve(pkg, stylesheet), "utf8");
  for (const match of css.matchAll(
    /@import\s+(?:url\()?\s*["']([^"']+)["']/g,
  )) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;
    const target = relative(
      pkg,
      resolve(pkg, stylesheet, "..", specifier),
    ).replaceAll("\\", "/");
    if (!packedSet.has(target)) brokenCssImports.push({ stylesheet, target });
  }
}
const report = {
  name: manifest.name,
  version: manifest.version,
  tarballBytes: pack.size,
  unpackedBytes: pack.unpackedSize,
  totalFiles: paths.length,
  legacyComponentFiles: legacyComponentPaths.length,
  extractedUiFiles: packedExtractedUi.length,
  stylesheetFiles: stylesheetPaths.length,
  sourceMapFiles: sourceMaps.length,
  uiWorkspaceFiles: uiOnlyPaths.length,
  missingExports,
  brokenCssImports,
  examples: packedExtractedUi.slice(0, 25),
};
console.log(JSON.stringify(report, null, 2));
if (sourceMaps.length) {
  console.error(
    "Published framework contains unnecessary generated source maps.",
  );
  process.exitCode = 1;
}
if (brokenCssImports.length) {
  console.error("Packed CSS references stylesheets missing from the tarball.");
  process.exitCode = 1;
}
if (missingExports.length) {
  console.error("Public package exports do not exist in the npm tarball.");
  process.exitCode = 1;
}
if (uiOnlyPaths.length) {
  console.error(
    "Private moyaforge-ui files must never appear in the framework tarball.",
  );
  process.exitCode = 1;
}
if (process.argv.includes("--strict") && packedExtractedUi.length) {
  console.error(
    "Framework still packs extracted UI implementation files; finish issue #149 before release.",
  );
  process.exitCode = 1;
}
