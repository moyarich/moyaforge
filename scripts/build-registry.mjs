import { format } from "prettier";
import { parse } from "@babel/parser";
import {
  readFile,
  writeFile,
  readdir,
  stat,
  mkdir,
  rm,
  realpath,
} from "node:fs/promises";
import { resolve, relative, dirname, extname, basename } from "node:path";
import { pathToFileURL } from "node:url";

const kebab = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
function imports(text, file) {
  if (file.endsWith(".css"))
    return [...text.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
  const ast = parse(text, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
    createImportExpressions: true,
  });
  const found = new Set();
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(node.type) &&
      node.source
    )
      found.add(node.source.value);
    if (node.type === "ImportExpression") {
      if (node.source.type !== "StringLiteral")
        throw Error(
          `Nonliteral dynamic import in ${file}; registry imports must be statically resolvable.`,
        );
      found.add(node.source.value);
    }
    if (node.type === "TSImportType" && node.argument?.type === "StringLiteral")
      found.add(node.argument.value);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(ast.program);
  return [...found];
}

export async function buildRegistry(root, { check = false } = {}) {
  root = await realpath(root);
  const sourceRoot = resolve(root, "packages/moyaforge/src");
  const uiSourceRoot = resolve(root, "packages/moyaforge-ui/src");
  const uiComponentRoot = resolve(uiSourceRoot, "components");
  // Until all installable components are migrated, discover both source roots.
  const componentRoot = resolve(sourceRoot, "components");
  const sourceRoots = [sourceRoot, uiSourceRoot];
  const templateRoot = resolve(root, "registry/templates");
  const manifest = JSON.parse(
    await readFile(resolve(root, "packages/moyaforge/package.json"), "utf8"),
  );
  const declared = { ...manifest.peerDependencies, ...manifest.dependencies };
  const specs = new Map();
  function add(name, spec) {
    if (specs.has(name))
      throw Error(
        `Duplicate registry name '${name}': ${specs.get(name).entry} and ${spec.entry}`,
      );
    specs.set(name, spec);
  }
  async function discover(folder, rootFolder = componentRoot) {
    const entries = (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    if (folder !== rootFolder) {
      const entry = entries.find(
        (item) => item.isFile() && /^index\.(ts|tsx)$/.test(item.name),
      );
      if (entry)
        add(kebab(basename(folder)), { entry: resolve(folder, entry.name) });
    }
    for (const entry of entries)
      if (entry.isDirectory())
        await discover(resolve(folder, entry.name), rootFolder);
  }
  await discover(componentRoot);
  if (
    await stat(uiComponentRoot).then(
      () => true,
      () => false,
    )
  )
    await discover(uiComponentRoot, uiComponentRoot);
  for (const entry of (await readdir(templateRoot)).sort())
    if (/\.(tsx|ts)$/.test(entry))
      add(kebab(basename(entry, extname(entry))), {
        entry: resolve(templateRoot, entry),
        template: true,
      });
  async function resolveImport(base, specifier) {
    const path = resolve(dirname(base), specifier);
    for (const candidate of [
      path,
      path.replace(/\.js$/, ".ts"),
      path.replace(/\.js$/, ".tsx"),
      `${path}.ts`,
      `${path}.tsx`,
      resolve(path, "index.ts"),
      resolve(path, "index.tsx"),
    ])
      if (await isFile(candidate)) return candidate;
    throw Error(
      `Unresolved registry import '${specifier}' in ${relative(root, base)}`,
    );
  }
  const items = [];
  const styles = new Map();
  for (const [name, spec] of [...specs].sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  )) {
    const files = new Set();
    const dependencies = new Map();
    async function visit(file, template = false) {
      const canonical = await realpath(file);
      if (
        !template &&
        !sourceRoots.some((source) => canonical.startsWith(source + "/"))
      )
        throw Error(`Registry file outside canonical UI source: ${file}`);
      if (files.has(file)) return;
      files.add(file);
      const text = await readFile(file, "utf8");
      for (const specifier of imports(text, file)) {
        if (specifier.startsWith(".")) {
          // Templates retain their installed location alongside the copied source tree.
          const base = template ? resolve(sourceRoot, basename(file)) : file;
          await visit(await resolveImport(base, specifier));
        } else {
          const pkg = specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/")
            : specifier.split("/")[0];
          if (!declared[pkg])
            throw Error(
              `Undeclared registry dependency '${pkg}' imported by ${relative(root, file)}`,
            );
          dependencies.set(pkg, declared[pkg]);
        }
      }
      if (!template && !file.endsWith(".css"))
        for (const sibling of (await readdir(dirname(file))).sort())
          if (sibling.endsWith(".css"))
            await visit(resolve(dirname(file), sibling));
    }
    await visit(spec.entry, spec.template);
    const itemSourceRoot = spec.entry.startsWith(uiSourceRoot + "/")
      ? uiSourceRoot
      : sourceRoot;
    const stylesheet = await format(
      [...files]
        .filter((file) => file.endsWith(".css"))
        .sort()
        .map((file) => `@import "./${relative(itemSourceRoot, file)}";`)
        .join("\n"),
      { parser: "css" },
    );
    const stylePath = `registry/styles/${name}.css`;
    styles.set(`${name}.css`, stylesheet);
    const installed = [...files].sort().map((file) => ({
      path: relative(root, file),
      type: "registry:file",
      target: `~/src/components/moyaforge/${file === spec.entry && spec.template ? basename(file) : relative(itemSourceRoot, file)}`,
    }));
    installed.push({
      path: "LICENSE",
      type: "registry:file",
      target: "~/src/components/moyaforge/LICENSE",
    });
    installed.push({
      path: stylePath,
      type: "registry:file",
      target: `~/src/components/moyaforge/${name}.css`,
    });
    items.push({
      name,
      type: spec.template ? "registry:block" : "registry:component",
      title: name
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      description: `Editable MoyaForge ${name} source and CSS. Import the installed styles alongside the component.`,
      dependencies: [...dependencies]
        .sort(([a], [b]) => a.localeCompare(b, "en"))
        .map(([pkg, version]) => `${pkg}@${version}`),
      files: installed,
    });
  }
  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "moyaforge",
    homepage: "https://github.com/moyarich/moyaforge",
    items,
  };
  const output = await format(JSON.stringify(registry), { parser: "json" });
  const stylesRoot = resolve(root, "registry/styles");
  if (check) {
    if ((await readFile(resolve(root, "registry.json"), "utf8")) !== output)
      throw Error("Registry is stale. Run npm run registry:build.");
    const actual = (await readdir(stylesRoot))
      .filter((name) => name.endsWith(".css"))
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify([...styles.keys()].sort()))
      throw Error("Registry styles are stale. Run npm run registry:build.");
    for (const [name, contents] of styles)
      if ((await readFile(resolve(stylesRoot, name), "utf8")) !== contents)
        throw Error(`Stale stylesheet: ${name}`);
  } else {
    // Compute and validate the entire graph before changing generated output.
    await mkdir(stylesRoot, { recursive: true });
    for (const old of await readdir(stylesRoot))
      if (old.endsWith(".css") && !styles.has(old))
        await rm(resolve(stylesRoot, old));
    for (const [name, contents] of styles)
      await writeFile(resolve(stylesRoot, name), contents);
    await writeFile(resolve(root, "registry.json"), output);
  }
  return registry;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const registry = await buildRegistry(resolve(import.meta.dirname, ".."), {
    check: process.argv.includes("--check"),
  });
  console.log(
    `Validated ${registry.items.length} automatically discovered registry items.`,
  );
}
