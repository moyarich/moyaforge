import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { imports } from "./imports.ts";

interface RegistryManifest {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  registryDependencies?: Record<string, string>;
}

interface RegistrySpec {
  entry: string;
  template?: boolean;
}

interface RegistryFile {
  path: string;
  type: "registry:file";
  target: string;
}

export interface RegistryItem {
  name: string;
  type: "registry:block" | "registry:component";
  title: string;
  description: string;
  docs?: string;
  dependencies: string[];
  files: RegistryFile[];
}

interface BuildContext {
  root: string;
  uiSourceRoot: string;
  uiComponentRoot: string;
  templateRoot: string;
  declared: Record<string, string>;
}

const byName = (a: string, b: string) => a.localeCompare(b, "en");
const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const titleCase = (kebabName: string) =>
  kebabName
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

/** Package name from an import specifier: `@scope/pkg/deep` -> `@scope/pkg`. */
const packageName = (specifier: string) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];

async function isFile(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}

/** Existence check that treats any stat failure as "missing". */
const pathExists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function createContext(rawRoot: string): Promise<BuildContext> {
  const root = await realpath(rawRoot);
  const uiSourceRoot = resolve(root, "packages/moyaforge-ui/src");
  const manifest = await readJson<RegistryManifest>(
    resolve(root, "packages/moyaforge/package.json"),
  );
  const uiManifestPath = resolve(root, "packages/moyaforge-ui/package.json");
  const uiManifest: RegistryManifest = (await isFile(uiManifestPath))
    ? await readJson<RegistryManifest>(uiManifestPath)
    : {};

  return {
    root,
    uiSourceRoot,
    uiComponentRoot: resolve(uiSourceRoot, "components"),
    templateRoot: resolve(root, "registry/templates"),
    // Registry components declare dependencies independently of framework peers.
    declared: {
      ...manifest.peerDependencies,
      ...manifest.dependencies,
      ...uiManifest.registryDependencies,
    },
  };
}

export async function discoverSpecs(ctx: BuildContext) {
  const specs = new Map<string, RegistrySpec>();

  function add(name: string, spec: RegistrySpec) {
    const existing = specs.get(name);
    if (existing)
      throw Error(
        `Duplicate registry name '${name}': ${existing.entry} and ${spec.entry}`,
      );
    specs.set(name, spec);
  }

  async function discoverComponents(folder: string) {
    const entries = (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    if (folder !== ctx.uiComponentRoot) {
      const entry = entries.find(
        (item) => item.isFile() && /^index\.(ts|tsx)$/.test(item.name),
      );
      if (entry)
        add(kebab(basename(folder)), { entry: resolve(folder, entry.name) });
    }
    for (const entry of entries)
      if (entry.isDirectory())
        await discoverComponents(resolve(folder, entry.name));
  }

  if (await pathExists(ctx.uiComponentRoot))
    await discoverComponents(ctx.uiComponentRoot);

  for (const entry of (await readdir(ctx.templateRoot)).sort())
    if (/\.(tsx|ts)$/.test(entry))
      add(kebab(basename(entry, extname(entry))), {
        entry: resolve(ctx.templateRoot, entry),
        template: true,
      });

  return specs;
}

async function resolveImport(
  ctx: BuildContext,
  base: string,
  specifier: string,
) {
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
    `Unresolved registry import '${specifier}' in ${relative(ctx.root, base)}`,
  );
}

/** Walks the import graph from a spec's entry, collecting files and npm deps. */
async function collectGraph(ctx: BuildContext, spec: RegistrySpec) {
  const files = new Set<string>();
  const dependencies = new Map<string, string>();

  async function visit(file: string, template = false) {
    const canonical = await realpath(file);
    if (!template && !canonical.startsWith(ctx.uiSourceRoot + "/"))
      throw Error(`Registry file outside canonical UI source: ${file}`);
    if (files.has(file)) return;
    files.add(file);

    const text = await readFile(file, "utf8");
    for (const specifier of imports(text, file)) {
      if (specifier.startsWith(".")) {
        // Templates retain their installed location alongside the copied source tree.
        const base = template
          ? resolve(ctx.uiComponentRoot, basename(file))
          : file;
        await visit(await resolveImport(ctx, base, specifier));
      } else {
        const pkg = packageName(specifier);
        if (!ctx.declared[pkg])
          throw Error(
            `Undeclared registry dependency '${pkg}' imported by ${relative(ctx.root, file)}`,
          );
        dependencies.set(pkg, ctx.declared[pkg]);
      }
    }
  }

  await visit(spec.entry, spec.template);
  return { files, dependencies };
}

/**
 * Install public components directly under ui/, not ui/components/.
 * Files outside src/components must retain their relative import positions.
 */
function installTarget(ctx: BuildContext, spec: RegistrySpec, file: string) {
  if (file === spec.entry && spec.template)
    return `~/src/components/ui/${basename(file)}`;
  if (file.startsWith(ctx.uiComponentRoot + "/"))
    return `~/src/components/ui/${relative(ctx.uiComponentRoot, file)}`;
  return `~/src/components/${relative(ctx.uiSourceRoot, file)}`;
}

export async function buildItem(
  ctx: BuildContext,
  name: string,
  spec: RegistrySpec,
): Promise<RegistryItem> {
  const { files, dependencies } = await collectGraph(ctx, spec);

  const installed = [...files]
    .map((file): RegistryFile => ({
      path: relative(ctx.root, file),
      type: "registry:file",
      target: installTarget(ctx, spec, file),
    }))
    .sort((a, b) => byCodeUnit(a.path, b.path));

  // Documentation belongs to the registry, never to component source folders.
  const guidePath = resolve(ctx.root, "registry/docs", `${name}.md`);
  const docs = (await isFile(guidePath))
    ? await readFile(guidePath, "utf8")
    : undefined;

  return {
    name,
    type: spec.template ? "registry:block" : "registry:component",
    title: titleCase(name),
    description: `Editable MoyaForge ${name} source. Components import their own CSS.`,
    ...(docs ? { docs } : {}),
    dependencies: [...dependencies]
      .sort(([a], [b]) => byName(a, b))
      .map(([pkg, version]) => `${pkg}@${version}`),
    files: installed,
  };
}
