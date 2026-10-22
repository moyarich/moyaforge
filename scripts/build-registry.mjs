import { format } from "prettier";
import { parse } from "@babel/parser";
import postcss from "postcss";
import parseValue from "postcss-value-parser";
import {
  readFile,
  writeFile,
  readdir,
  stat,
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
  if (file.endsWith(".css")) {
    const found = new Set();
    // Parse real at-rules so examples inside comments are never copied.
    postcss.parse(text, { from: file }).walkAtRules(/^import$/i, (rule) => {
      const first = parseValue(rule.params).nodes.find(
        (node) => node.type !== "space" && node.type !== "comment",
      );
      let path;
      if (first?.type === "string") path = first.value;
      else if (
        first?.type === "function" &&
        first.value.toLowerCase() === "url"
      ) {
        const value = first.nodes.filter(
          (node) => node.type !== "space" && node.type !== "comment",
        );
        if (value.length === 1 && ["word", "string"].includes(value[0].type))
          path = value[0].value;
      }
      if (!path)
        throw Error(`Unresolvable CSS @import in ${file}: ${rule.params}`);
      // Remote and site-root URLs remain owned by the host stylesheet.
      if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(path)) return;
      // CSS imports are relative to their stylesheet, even without './'.
      found.add(path.startsWith(".") ? path : `./${path}`);
    });
    return [...found];
  }
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
    if (node.type === "TSImportType") {
      // Babel 8 renamed argument to source; retain compatibility with Babel 7.
      const source = node.source ?? node.argument;
      if (source?.type === "StringLiteral") found.add(source.value);
    }
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
  const uiSourceRoot = resolve(root, "packages/moyaforge-ui/src");
  const uiComponentRoot = resolve(uiSourceRoot, "components");
  const sourceRoots = [uiSourceRoot];
  const templateRoot = resolve(root, "registry/templates");
  const manifest = JSON.parse(
    await readFile(resolve(root, "packages/moyaforge/package.json"), "utf8"),
  );
  const uiManifestPath = resolve(root, "packages/moyaforge-ui/package.json");
  const uiManifest = (await isFile(uiManifestPath))
    ? JSON.parse(await readFile(uiManifestPath, "utf8"))
    : {};
  // Registry components declare dependencies independently of framework peers.
  const declared = {
    ...manifest.peerDependencies,
    ...manifest.dependencies,
    ...uiManifest.registryDependencies,
  };
  const specs = new Map();
  function add(name, spec) {
    if (specs.has(name))
      throw Error(
        `Duplicate registry name '${name}': ${specs.get(name).entry} and ${spec.entry}`,
      );
    specs.set(name, spec);
  }
  async function discover(folder, rootFolder = uiComponentRoot) {
    const entries = (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    if (folder !== rootFolder) {
      const entry = entries.find(
        (item) => item.isFile() && /^index\.(ts|tsx)$/.test(item.name),
      );
      if (entry) {
        const name = kebab(basename(folder));
        add(name, {
          entry: resolve(folder, entry.name),
          uiSource: rootFolder === uiComponentRoot,
        });
      }
    }
    for (const entry of entries)
      if (entry.isDirectory())
        await discover(resolve(folder, entry.name), rootFolder);
  }
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
    const path = resolve(dirname(base), specifier.replace(/[?#].*$/, ""));
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
          const base = template ? resolve(uiSourceRoot, basename(file)) : file;
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
    }
    await visit(spec.entry, spec.template);
    const itemSourceRoot = uiSourceRoot;
    // Install public components directly under ui/, not ui/components/.
    // Files outside src/components must retain their relative import positions.
    const installTarget = (file) => {
      if (file === spec.entry && spec.template)
        return `~/src/components/ui/${basename(file)}`;
      if (file.startsWith(uiComponentRoot + "/"))
        return `~/src/components/ui/${relative(uiComponentRoot, file)}`;
      return `~/src/components/${relative(uiSourceRoot, file)}`;
    };
    const installed = [...files].sort().map((file) => ({
      path: relative(root, file),
      type: "registry:file",
      target: installTarget(file),
    }));
    const guidePath = resolve(dirname(spec.entry), "README.md");
    let setupDocs;
    if (await isFile(guidePath)) {
      const canonical = await realpath(guidePath);
      if (!canonical.startsWith(itemSourceRoot + "/"))
        throw Error(
          `Registry setup guide outside canonical source: ${guidePath}`,
        );
      setupDocs = await readFile(guidePath, "utf8");
    }
    installed.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    items.push({
      name,
      type: spec.template ? "registry:block" : "registry:component",
      title: name
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      description: `Editable MoyaForge ${name} source. Components import their own CSS.`,
      ...(setupDocs ? { docs: setupDocs } : {}),
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
  const output = await format(JSON.stringify(registry, null, 2), {
    parser: "json",
  });
  const stylesRoot = resolve(root, "registry/styles");
  if (check) {
    const existingRegistry = await readFile(
      resolve(root, "registry.json"),
      "utf8",
    );
    if (existingRegistry !== output) {
      let mismatch = 0;
      while (
        mismatch < Math.min(existingRegistry.length, output.length) &&
        existingRegistry[mismatch] === output[mismatch]
      )
        mismatch++;
      throw Error(
        `Registry is stale at character ${mismatch}: expected ${JSON.stringify(output.slice(mismatch, mismatch + 100))}, found ${JSON.stringify(existingRegistry.slice(mismatch, mismatch + 100))}. Run npm run registry:build.`,
      );
    }
    if (
      await stat(stylesRoot).then(
        () => true,
        () => false,
      )
    )
      throw Error(
        "Obsolete registry/styles output exists. Run npm run registry:build.",
      );
  } else {
    // Validate the entire graph before replacing the manifest or removing legacy output.
    await rm(stylesRoot, { recursive: true, force: true });
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
