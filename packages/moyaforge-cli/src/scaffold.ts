import type { InstallPlan, PlannedFile, PackageManifest } from "./types.js";
import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { defaultDirectory, defaultRegistry, readOptional, within, safeDestination } from "./registry.js";
import { mergeDependencies } from "./dependencies.js";

export interface ScaffoldOptions {
  root: string;
  mode?: "source" | "package";
  template?: "docs" | "hybrid" | "existing";
  search?: boolean;
  directory?: string;
  registry?: string;
}
const starterFiles = [
  "index.html", "registry.config.ts", "tsconfig.json", "src/main.tsx",
  "src/App.tsx", "src/mdx.d.ts", "src/styles.css",
  "src/SearchPanel.tsx", "src/Playground.tsx", "vite.config.ts",
] as const;
function local(appRoot: string, target: string) {
  const path = relative(resolve(appRoot, "src"), target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
}
/** Build a reviewable installation plan from real files, without writing. */
export async function planProject({
  root, mode = "source", template = "docs", search = false,
  directory = defaultDirectory, registry = defaultRegistry,
}: ScaffoldOptions): Promise<InstallPlan & { manifestPath: string }> {
  if (!["source", "package"].includes(mode)) throw Error("--mode must be source or package");
  if (!["docs", "hybrid", "existing"].includes(template)) throw Error("--template must be docs, hybrid or existing");
  const appRoot = within(root, template === "existing" ? "moyaforge" : ".");
  const values: Record<string, string> = {
    __UI__: local(appRoot, within(root, directory)),
    __DOCS_BASE__: template === "existing" ? "../docs" : "docs",
    __PLAYGROUND_ENABLED__: String(template === "hybrid"),
  };
  const files: PlannedFile[] = [];
  async function add(path: string, content: string, merge = false) {
    const destination = await safeDestination(root, path);
    files.push({ path: destination, content, previous: await readOptional(destination), merge });
  }
  const templateFile = (name: string) =>
    readFile(new URL(`../templates/${name}`, import.meta.url), "utf8");
  for (const name of starterFiles) {
    const source = name === "tsconfig.json" ? "tsconfig.template.json" :
      name === "vite.config.ts" && search ? "vite.search.config.ts" :
      name === "src/SearchPanel.tsx" && search ? "src/SearchPanel.search.tsx" : name;
    let content = await templateFile(source);
    for (const [token, value] of Object.entries(values)) content = content.replaceAll(token, value);
    await add(resolve(appRoot, name), content);
  }
  for (const name of ["docs/page.mdx", "docs/guide/page.mdx"])
    await add(resolve(root, name), await templateFile(name));
  const manifestPath = resolve(root, "package.json");
  const previous = await readOptional(manifestPath);
  const base: PackageManifest = JSON.parse(await templateFile("package.json"));
  const initial: PackageManifest = previous ? JSON.parse(previous) :
    template === "existing"
      ? { name: base.name, version: base.version, private: base.private, type: base.type }
      : structuredClone(base);
  const { manifest, dependencies } = mergeDependencies(initial, base, template, mode, search);
  await add(manifestPath, JSON.stringify(manifest, null, 2) + "\n", true);
  await add(resolve(root, "moyaforge.components.json"), JSON.stringify({ registry, directory }, null, 2) + "\n");
  return { files, dependencies, manifestPath };
}
/** Configure an existing project without generating an application. */
export async function planConfiguration({
  root, registry = defaultRegistry, directory = defaultDirectory,
}: Pick<ScaffoldOptions, "root" | "registry" | "directory">): Promise<InstallPlan> {
  const path = await safeDestination(root, resolve(root, "moyaforge.components.json"));
  return {
    files: [{ path, content: JSON.stringify({ registry, directory }, null, 2) + "\n", previous: await readOptional(path) }],
    dependencies: [],
  };
}
