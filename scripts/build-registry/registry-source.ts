import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { imports } from "./imports.ts";

interface RegistryManifest {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  registryDependencies?: Record<string, string>;
}

/** A package root from which the registry can discover and install components. */
export interface RegistryComponentSource {
  /** Workspace-relative package directory containing package.json. */
  packagePath: string;
  /** Package-relative component directory; defaults to src/components. */
  componentsPath?: string;
  /** Optional public registry names keyed by component folder name. */
  nameOverrides?: Readonly<Record<string, string>>;
}

interface SourceContext {
  sourceRoot: string;
  componentRoot: string;
  declared: Record<string, string>;
  nameOverrides: Readonly<Record<string, string>>;
}

interface RegistrySpec {
  entry: string;
  source: SourceContext;
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
  sources: SourceContext[];
  templateRoot: string;
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

export async function createContext(
  rawRoot: string,
  packages: readonly RegistryComponentSource[] = [
    { packagePath: "packages/moyaforge-ui" },
  ],
): Promise<BuildContext> {
  const root = await realpath(rawRoot);
  if (!packages.length)
    throw Error("Registry generation requires at least one component source.");

  const headlessManifestPath = resolve(root, "packages/moyaforge/package.json");
  const headlessManifest: RegistryManifest = (await isFile(headlessManifestPath))
    ? await readJson<RegistryManifest>(headlessManifestPath)
    : {};

  const sources = await Promise.all(
    packages.map(async ({ packagePath, componentsPath, nameOverrides }) => {
      const packageRoot = await realpath(resolve(root, packagePath));
      const relativePackage = relative(root, packageRoot);
      if (
        relativePackage === ".." ||
        relativePackage.startsWith("../") ||
        relativePackage.startsWith("..\\")
      )
        throw Error(`Registry package escapes the workspace: ${packagePath}`);

      const manifest = await readJson<RegistryManifest>(
        resolve(packageRoot, "package.json"),
      );
      const sourceRoot = resolve(packageRoot, "src");
      const componentRoot = resolve(
        packageRoot,
        componentsPath ?? "src/components",
      );
      const relativeComponents = relative(sourceRoot, componentRoot);
      if (
        relativeComponents === ".." ||
        relativeComponents.startsWith("../") ||
        relativeComponents.startsWith("..\\")
      )
        throw Error(`Registry component directory is outside src: ${componentsPath}`);

      return {
        sourceRoot,
        componentRoot,
        nameOverrides: nameOverrides ?? {},
        declared: {
          ...headlessManifest.peerDependencies,
          ...headlessManifest.dependencies,
          ...manifest.peerDependencies,
          ...manifest.dependencies,
          ...manifest.registryDependencies,
        },
      };
    }),
  );

  return {
    root,
    sources,
    templateRoot: resolve(root, "registry/templates"),
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

  async function discoverComponents(folder: string, source: SourceContext) {
    const entries = (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    if (folder !== source.componentRoot) {
      const entry = entries.find(
        (item) => item.isFile() && /^index\.(ts|tsx)$/.test(item.name),
      );
      if (entry) {
        const folderName = basename(folder);
        add(source.nameOverrides[folderName] ?? kebab(folderName), {
          entry: resolve(folder, entry.name),
          source,
        });
      }
    }
    for (const entry of entries)
      if (entry.isDirectory())
        await discoverComponents(resolve(folder, entry.name), source);
  }

  for (const source of ctx.sources)
    if (await pathExists(source.componentRoot))
      await discoverComponents(source.componentRoot, source);

  if (await pathExists(ctx.templateRoot))
    for (const entry of (await readdir(ctx.templateRoot)).sort())
      if (/\.(tsx|ts)$/.test(entry))
        add(kebab(basename(entry, extname(entry))), {
          entry: resolve(ctx.templateRoot, entry),
          source: ctx.sources[0],
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
    if (!template && !canonical.startsWith(spec.source.sourceRoot + "/"))
      throw Error(`Registry file outside configured component source: ${file}`);
    if (files.has(file)) return;
    files.add(file);

    const text = await readFile(file, "utf8");
    for (const specifier of imports(text, file)) {
      if (specifier.startsWith(".")) {
        // Templates retain their installed location alongside the copied source tree.
        const base = template
          ? resolve(spec.source.componentRoot, basename(file))
          : file;
        await visit(await resolveImport(ctx, base, specifier));
      } else {
        const pkg = packageName(specifier);
        if (!spec.source.declared[pkg])
          throw Error(
            `Undeclared registry dependency '${pkg}' imported by ${relative(ctx.root, file)}`,
          );
        dependencies.set(pkg, spec.source.declared[pkg]);
        // Installed TypeScript source also needs any declared companion types.
        const types = `@types/${pkg.replace(/^@/, "").replace("/", "__")}`;
        if (spec.source.declared[types])
          dependencies.set(types, spec.source.declared[types]);
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
  if (file.startsWith(spec.source.componentRoot + "/"))
    return `~/src/components/ui/${relative(spec.source.componentRoot, file)}`;
  return `~/src/components/${relative(spec.source.sourceRoot, file)}`;
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
