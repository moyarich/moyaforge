import { format } from "prettier";
import { readFile, writeFile, readdir, access, mkdir } from "node:fs/promises";
import { resolve, relative, dirname, extname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "packages/moyaforge/src");
const specs = {
  "code-block": { entries: ["components/CodeBlock/CodeBlock.tsx"], deps: [] },
  "code-group": {
    entries: ["components/CodeGroup/CodeGroup.tsx"],
    deps: ["code-block"],
  },
  "sidebar-v1": { entries: ["components/SidebarV1/index.ts"], deps: [] },
  "sidebar-v2": { entries: ["components/SidebarV2/index.ts"], deps: [] },
  "doc-outline": { entries: ["components/DocOutline/index.ts"], deps: [] },
  "docs-shell": {
    entries: ["components/Layout/DocsLayout/DocumentationSite.tsx"],
    deps: ["sidebar-v1", "doc-outline", "code-group"],
  },
};
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function resolveImport(base, specifier) {
  const path = resolve(dirname(base), specifier);
  for (const candidate of [
    path,
    path.replace(/\.js$/, ".ts"),
    path.replace(/\.js$/, ".tsx"),
  ])
    if (await exists(candidate)) return candidate;
  throw Error(`Unresolved registry import ${specifier} in ${base}`);
}
async function closure(entries) {
  const files = new Set();
  async function visit(file) {
    if (files.has(file)) return;
    if (!file.startsWith(sourceRoot + "/"))
      throw Error(`Registry file outside canonical UI source: ${file}`);
    files.add(file);
    const text = await readFile(file, "utf8");
    const imports = [
      ...text.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g),
    ].map((match) => match[1]);
    for (const specifier of imports.filter((value) => value.startsWith(".")))
      await visit(await resolveImport(file, specifier));
    for (const name of await readdir(dirname(file)))
      if (extname(name) === ".css") files.add(resolve(dirname(file), name));
  }
  for (const entry of entries) await visit(resolve(sourceRoot, entry));
  return files;
}
const closures = Object.fromEntries(
  await Promise.all(
    Object.entries(specs).map(async ([name, spec]) => [
      name,
      await closure(spec.entries),
    ]),
  ),
);
const items = [];
for (const [name, spec] of Object.entries(specs)) {
  const provided = new Set(spec.deps.flatMap((dep) => [...closures[dep]]));
  const files = [...closures[name]]
    .filter((file) => !provided.has(file))
    .sort()
    .map((file) => ({
      path: relative(root, file),
      type: "registry:file",
      target: `~/src/components/moyaforge/${relative(sourceRoot, file)}`,
    }));
  files.push({
    path: "LICENSE",
    type: "registry:file",
    target: "~/src/components/moyaforge/LICENSE",
  });
  const dependencies = new Set(["react@>=18"]);
  for (const file of closures[name]) {
    const source = await readFile(file, "utf8");
    if (source.includes('from "react-router-dom"'))
      dependencies.add("react-router-dom@^7.18.4");
    if (source.includes('from "@moyarich/moyaforge-mdx'))
      dependencies.add("@moyarich/moyaforge-mdx@^0.2.0");
  }
  const styleFiles = new Set([
    ...closures[name],
    ...spec.deps.flatMap((dep) => [...closures[dep]]),
  ]);
  const stylesheet =
    [...styleFiles]
      .filter((file) => file.endsWith(".css"))
      .sort()
      .map((file) => `@import "./${relative(sourceRoot, file)}";`)
      .join("\n") + "\n";
  const stylePath = `registry/styles/${name}.css`;
  if (process.argv.includes("--check")) {
    if ((await readFile(resolve(root, stylePath), "utf8")) !== stylesheet)
      throw Error(`Stale stylesheet: ${stylePath}`);
  } else {
    await mkdir(resolve(root, "registry/styles"), { recursive: true });
    await writeFile(resolve(root, stylePath), stylesheet);
  }
  files.push({
    path: stylePath,
    type: "registry:file",
    target: `~/src/components/moyaforge/${name}.css`,
  });
  if (name === "docs-shell")
    files.push({
      path: "registry/templates/docs-shell.tsx",
      type: "registry:file",
      target: "~/src/components/moyaforge/docs-shell.tsx",
    });
  items.push({
    name,
    type: "registry:block",
    title: name
      .split("-")
      .map((x) => x[0].toUpperCase() + x.slice(1))
      .join(" "),
    description: `Editable MoyaForge ${name} source and CSS. Import the installed styles alongside the component.`,
    dependencies: [...dependencies],
    registryDependencies: spec.deps.map((dep) => `moyarich/moyaforge/${dep}`),
    files,
  });
}
const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "moyaforge",
  homepage: "https://github.com/moyarich/moyaforge",
  items,
};
const output = await format(JSON.stringify(registry), { parser: "json" });
if (process.argv.includes("--check")) {
  if (
    JSON.stringify(
      JSON.parse(await readFile(resolve(root, "registry.json"), "utf8")),
    ) !== JSON.stringify(registry)
  )
    throw Error("Registry is stale. Run npm run registry:build.");
} else await writeFile(resolve(root, "registry.json"), output);
console.log(
  `Validated ${items.length} registry items against canonical component source.`,
);
