import type { InstallPlan, PlannedFile, PackageManifest } from "./types.js";
import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import {
  defaultDirectory,
  defaultRegistry,
  readOptional,
  within,
  safeDestination,
} from "./registry.js";
import { mergeDependencies } from "./dependencies.js";

const MODES = ["source", "package"] as const;
const TEMPLATES = ["docs", "hybrid", "existing"] as const;

export type Mode = (typeof MODES)[number];
export type Template = (typeof TEMPLATES)[number];

export interface ScaffoldOptions {
  root: string;
  mode?: Mode;
  template?: Template;
  search?: boolean;
  directory?: string;
  registry?: string;
}

const STARTER_FILES = [
  "index.html",
  "registry.config.ts",
  "tsconfig.json",
  "src/main.tsx",
  "src/App.tsx",
  "src/mdx.d.ts",
  "src/styles.css",
  "src/SearchPanel.tsx",
  "src/Playground.tsx",
  "vite.config.ts",
] as const;

const DOC_PAGES = ["docs/page.mdx", "docs/guide/page.mdx"] as const;
const COMPONENTS_CONFIG = "moyaforge.components.json";

/** Templates that are stored under a different name than their destination. */
const ALWAYS_RENAMED: Record<string, string> = {
  "tsconfig.json": "tsconfig.template.json",
};
const RENAMED_WITH_SEARCH: Record<string, string> = {
  "vite.config.ts": "vite.search.config.ts",
  "src/SearchPanel.tsx": "src/SearchPanel.search.tsx",
};

function assertOption<T extends string>(
  flag: string,
  value: string,
  allowed: readonly T[],
): asserts value is T {
  if (allowed.includes(value as T)) return;
  const head = allowed.slice(0, -1).join(", ");
  throw new Error(`--${flag} must be ${head} or ${allowed.at(-1)}`);
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

/** Import specifier for `target`, relative to the app's `src` directory. */
function relativeImport(appRoot: string, target: string): string {
  const path = relative(resolve(appRoot, "src"), target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
}

function templateSource(name: string, search: boolean): string {
  return (
    ALWAYS_RENAMED[name] ??
    (search ? RENAMED_WITH_SEARCH[name] : undefined) ??
    name
  );
}

function readTemplate(name: string): Promise<string> {
  return readFile(new URL(`../templates/${name}`, import.meta.url), "utf8");
}

function fillTokens(content: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [token, value]) => text.replaceAll(token, value),
    content,
  );
}

function initialManifest(
  previous: string | undefined,
  base: PackageManifest,
  template: Template,
): PackageManifest {
  if (previous) return JSON.parse(previous);
  if (template !== "existing") return structuredClone(base);
  const { name, version, private: isPrivate, type } = base;
  return { name, version, private: isPrivate, type };
}

async function planFile(
  root: string,
  path: string,
  content: string,
  merge = false,
): Promise<PlannedFile> {
  const destination = await safeDestination(root, path);
  return {
    path: destination,
    content,
    previous: await readOptional(destination),
    merge,
  };
}

/** Build a reviewable installation plan from real files, without writing. */
export async function planProject({
  root,
  mode = "source",
  template = "docs",
  search = false,
  directory = defaultDirectory,
  registry = defaultRegistry,
}: ScaffoldOptions): Promise<InstallPlan & { manifestPath: string }> {
  assertOption("mode", mode, MODES);
  assertOption("template", template, TEMPLATES);

  const isExisting = template === "existing";
  const appRoot = within(root, isExisting ? "moyaforge" : ".");
  const tokens = {
    __UI__: relativeImport(appRoot, within(root, directory)),
    __DOCS_BASE__: isExisting ? "../docs" : "docs",
    __PLAYGROUND_ENABLED__: String(template === "hybrid"),
  };

  const files: PlannedFile[] = [];

  for (const name of STARTER_FILES) {
    const content = fillTokens(await readTemplate(templateSource(name, search)), tokens);
    files.push(await planFile(root, resolve(appRoot, name), content));
  }

  for (const name of DOC_PAGES) {
    files.push(await planFile(root, resolve(root, name), await readTemplate(name)));
  }

  const manifestPath = resolve(root, "package.json");
  const base: PackageManifest = JSON.parse(await readTemplate("package.json"));
  const initial = initialManifest(await readOptional(manifestPath), base, template);
  const { manifest, dependencies } = mergeDependencies(initial, base, template, mode, search);

  files.push(await planFile(root, manifestPath, toJson(manifest), true));
  files.push(
    await planFile(root, resolve(root, COMPONENTS_CONFIG), toJson({ registry, directory })),
  );

  return { files, dependencies, manifestPath };
}

/** Configure an existing project without generating an application. */
export async function planConfiguration({
  root,
  registry = defaultRegistry,
  directory = defaultDirectory,
}: Pick<ScaffoldOptions, "root" | "registry" | "directory">): Promise<InstallPlan> {
  const path = await safeDestination(root, resolve(root, COMPONENTS_CONFIG));
  return {
    files: [
      {
        path,
        content: toJson({ registry, directory }),
        previous: await readOptional(path),
      },
    ],
    dependencies: [],
  };
}
