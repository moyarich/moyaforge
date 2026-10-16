import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
const extractedUiGroups = [
  "NavigationTree",
  "SidebarV1",
  "SidebarV2",
  "Page",
  "Layout/DocsLayout",
];
const packedExtractedUi = legacyComponentPaths.filter((path) =>
  extractedUiGroups.some(
    (group) =>
      path.startsWith(`dist/components/${group}/`) ||
      path.startsWith(`src/components/${group}/`),
  ),
);
const stylesheetPaths = paths.filter((path) => path.endsWith(".css"));
const uiOnlyPaths = paths.filter((path) => path.includes("moyaforge-ui"));
// npm's files allowlist does not guarantee that every public export target
// survives packing. Check both the JS and declaration targets before release.
const exportTargets = Object.entries(manifest.exports ?? {}).flatMap(
  ([subpath, declaration]) => {
    const targets =
      typeof declaration === "string"
        ? [declaration]
        : Object.values(declaration).filter((value) => typeof value === "string");
    return targets.map((target) => ({ subpath, target: target.replace(/^\.\//, "") }));
  },
);
const missingExports = exportTargets.filter(({ target }) => !paths.includes(target));
const report = {
  name: manifest.name,
  version: manifest.version,
  tarballBytes: pack.size,
  unpackedBytes: pack.unpackedSize,
  totalFiles: paths.length,
  legacyComponentFiles: legacyComponentPaths.length,
  extractedUiFiles: packedExtractedUi.length,
  stylesheetFiles: stylesheetPaths.length,
  uiWorkspaceFiles: uiOnlyPaths.length,
  missingExports,
  examples: packedExtractedUi.slice(0, 25),
};
console.log(JSON.stringify(report, null, 2));
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
