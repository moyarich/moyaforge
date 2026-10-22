import { parse } from "@babel/parser";
import { expect, test } from "vitest";
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
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  function walk(node) {
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(node?.type) &&
      node.source?.type === "StringLiteral"
    ) {
      const target = resolveLocal(filename, node.source.value);
      if (target) visit(target, found);
    }
    if (!node || typeof node !== "object") return;
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === "object") walk(child);
    }
  }
  walk(ast);
}
function auditEntrypoints() {
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

  return result;
}

test("framework public entrypoints have no extracted UI dependencies", () => {
  const report = auditEntrypoints();
  expect(Object.keys(report).sort()).toEqual(["headless.ts", "index.ts", "registry-routes.tsx"]);
  for (const [entrypoint, result] of Object.entries(report)) {
    expect(result.sourceFiles, entrypoint).toBeGreaterThan(1);
    expect(result.extractedUiFiles, entrypoint).toBe(0);
    expect(result.extractedUiImports, entrypoint).toEqual([]);
  }
});
