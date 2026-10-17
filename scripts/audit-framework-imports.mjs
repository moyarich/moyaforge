import * as ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "packages/moyaforge/src");
const entrypoints = ["index.ts", "registry-routes.tsx", "headless.ts"];
const groups = [
  "NavigationTree",
  "SidebarV1",
  "SidebarV2",
  "Page",
  "Layout/DocsLayout",
  "Layout/DocumentationSite",
];
function resolveLocal(from, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = resolve(dirname(from), specifier);
  const candidates = [
    base,
    base.replace(/\.js$/, ".ts"),
    base.replace(/\.js$/, ".tsx"),
    base + ".ts",
    base + ".tsx",
    base.replace(/\.js$/, ".mts"),
    resolve(base, "index.ts"),
    resolve(base, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}
function visit(filename, found) {
  if (found.has(filename) || !existsSync(filename)) return;
  found.add(filename);
  const code = readFileSync(filename, "utf8");
  const ast = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
  function walk(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = resolveLocal(filename, node.moduleSpecifier.text);
      if (target) visit(target, found);
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
}
const result = {};
for (const entry of entrypoints) {
  const files = new Set();
  visit(resolve(src, entry), files);
  const paths = [...files].map((file) =>
    relative(src, file).replaceAll("\\", "/"),
  );
  const ui = paths.filter((path) =>
    groups.some((group) => path.startsWith(`components/${group}/`)),
  );
  result[entry] = {
    sourceFiles: paths.length,
    extractedUiFiles: ui.length,
    extractedUiImports: ui.sort(),
  };
}
console.log(JSON.stringify(result, null, 2));
if (
  process.argv.includes("--strict") &&
  Object.values(result).some((entry) => entry.extractedUiFiles > 0)
) {
  console.error(
    "Framework public entrypoints still import UI implementations.",
  );
  process.exitCode = 1;
}
