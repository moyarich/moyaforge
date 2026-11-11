import type { InstallPlan, PlannedFile, PackageManifest } from "./types.js";
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultDirectory, defaultRegistry, readOptional, safeDestination, within } from "./registry.js";
import { mergeDependencies } from "./dependencies.js";

export interface ScaffoldOptions {
  root: string;
  mode?: "source" | "package";
  template?: "docs" | "hybrid" | "existing";
  search?: boolean;
  directory?: string;
  registry?: string;
}

const templates = fileURLToPath(new URL("../templates/", import.meta.url));
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

async function* filesIn(directory: string): AsyncGenerator<string> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* filesIn(path);
    else if (entry.isFile()) yield path;
  }
}

/** Plan changes without writing; existing consumer files are kept unless merged. */
export async function planProject({
  root, mode = "source", template = "docs", search = false,
  directory = defaultDirectory, registry = defaultRegistry,
}: ScaffoldOptions): Promise<InstallPlan & { manifestPath: string }> {
  if (mode !== "source" && mode !== "package")
    throw Error("--mode must be source or package");
  if (template !== "docs" && template !== "hybrid" && template !== "existing")
    throw Error("--template must be docs, hybrid or existing");

  const appRoot = within(root, template === "existing" ? "moyaforge" : ".");
  const uiPath = relative(resolve(appRoot, "src"), within(root, directory)).replaceAll("\\", "/");
  const tokens: Record<string, string> = {
    __UI__: uiPath.startsWith(".") ? uiPath : `./${uiPath}`,
    __DOCS_BASE__: template === "existing" ? "../docs" : "docs",
    __PLAYGROUND_ENABLED__: String(template === "hybrid"),
  };

  const files: PlannedFile[] = [];
  const add = async (path: string, content: string, merge = false) => {
    const destination = await safeDestination(root, path);
    files.push({ path: destination, content, merge, previous: await readOptional(destination) });
  };

  // Optional template directories overlay files at the same relative path.
  const selected = new Map<string, string>();
  for (const layer of ["base", ...(search ? ["search"] : [])]) {
    const folder = join(templates, layer);
    for await (const file of filesIn(folder)) {
      const name = relative(folder, file).replace(/\.template$/, "");
      if (name !== "package.json") selected.set(name, await readFile(file, "utf8"));
    }
  }
  for (const [name, source] of selected) {
    let content = source;
    for (const [token, value] of Object.entries(tokens))
      content = content.replaceAll(token, value);
    await add(resolve(appRoot, name), content);
  }

  const docsFolder = join(templates, "docs");
  for await (const file of filesIn(docsFolder))
    await add(resolve(root, "docs", relative(docsFolder, file)), await readFile(file, "utf8"));

  const manifestPath = resolve(root, "package.json");
  const base: PackageManifest = JSON.parse(await readFile(join(templates, "base/package.json"), "utf8"));
  const previous = await readOptional(manifestPath);
  const manifest: PackageManifest = previous ? JSON.parse(previous)
    : template === "existing"
      ? { name: base.name, version: base.version, private: base.private, type: base.type }
      : structuredClone(base);
  const merged = mergeDependencies(manifest, base, template, mode, search);
  await add(manifestPath, json(merged.manifest), true);
  await add(resolve(root, "moyaforge.components.json"), json({ registry, directory }));

  return { files, dependencies: merged.dependencies, manifestPath };
}

/** Initialize registry settings only, without creating a documentation site. */
export async function planConfiguration({
  root, registry = defaultRegistry, directory = defaultDirectory,
}: Pick<ScaffoldOptions, "root" | "registry" | "directory">): Promise<InstallPlan> {
  const path = await safeDestination(root, resolve(root, "moyaforge.components.json"));
  return {
    files: [{ path, content: json({ registry, directory }), previous: await readOptional(path) }],
    dependencies: [],
  };
}
