import type { InstallPlan, PlannedFile, PackageManifest } from "./types.js";
import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
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

const STARTER_FILES = [
  "index.html", "registry.config.ts", "tsconfig.json", "src/main.tsx",
  "src/App.tsx", "src/mdx.d.ts", "src/styles.css",
  "src/SearchPanel.tsx", "src/Playground.tsx", "vite.config.ts",
] as const;
const DOC_PAGES = ["docs/page.mdx", "docs/guide/page.mdx"] as const;

const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const readTemplate = (name: string) =>
  readFile(new URL(`../templates/${name}`, import.meta.url), "utf8");

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
    files.push({
      path: destination, content, merge,
      previous: await readOptional(destination),
    });
  };

  for (const name of STARTER_FILES) {
    const source = name === "tsconfig.json" ? "tsconfig.template.json"
      : search && name === "vite.config.ts" ? "vite.search.config.ts"
      : search && name === "src/SearchPanel.tsx" ? "src/SearchPanel.search.tsx"
      : name;
    let content = await readTemplate(source);
    for (const [token, value] of Object.entries(tokens))
      content = content.replaceAll(token, value);
    await add(resolve(appRoot, name), content);
  }
  for (const name of DOC_PAGES)
    await add(resolve(root, name), await readTemplate(name));

  const manifestPath = resolve(root, "package.json");
  const base: PackageManifest = JSON.parse(await readTemplate("package.json"));
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
    files: [{
      path, content: json({ registry, directory }),
      previous: await readOptional(path),
    }],
    dependencies: [],
  };
}
