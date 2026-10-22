import type { PathLike } from "node:fs";
import type {
  InstallPlan,
  PlannedFile,
  Registry,
  RegistryItem,
} from "./types.js";
export type * from "./types.js";
import { readFile, writeFile, mkdir, lstat, realpath } from "node:fs/promises";
import { resolve, dirname, relative, isAbsolute, sep } from "node:path";
import { spawnSync } from "node:child_process";

export const defaultRegistry =
  "https://raw.githubusercontent.com/moyarich/moyaforge/main/registry.json";
export const defaultDirectory = "src/components/ui";
/** Read UTF-8 content, returning undefined only when the file is absent. */
export async function readOptional(path: PathLike) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
/** Resolve a path while rejecting destinations outside the project. */
export function within(root: string, path: string) {
  const destination = resolve(root, path);
  const rel = relative(resolve(root), destination);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw Error(`Path escapes project: ${path}`);
  return destination;
}
/** Check every existing ancestor, not only the destination, before writing. */
export async function safeDestination(root: string, path: string) {
  const destination = within(root, path);
  const canonicalRoot = await realpath(root);
  let current = destination;
  while (current !== resolve(root)) {
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink())
        throw Error(`Refusing to write through a symlink: ${current}`);
      within(canonicalRoot, await realpath(current));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    current = dirname(current);
  }
  return destination;
}
/** Fetch registry text with a bounded request lifetime. */
async function fetchText(url: string | URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw Error(`Registry request failed (${response.status}): ${url}`);
  return response.text();
}
/** Load local or HTTP registry metadata and its source reader. */
export async function loadRegistry(
  location = defaultRegistry,
): Promise<{ registry: Registry; read: (path: string) => Promise<string> }> {
  if (/^https?:\/\//.test(location)) {
    const url = new URL(location);
    const registry = JSON.parse(await fetchText(url));
    return {
      registry,
      read: async (path: string) => {
        if (
          path.startsWith("/") ||
          path.split(/[\\/]/).includes("..") ||
          /^[a-z]+:/i.test(path)
        )
          throw Error(`Invalid registry source: ${path}`);
        return fetchText(
          new URL(path.split("/").map(encodeURIComponent).join("/"), url),
        );
      },
    };
  }
  const file = resolve(
    location.endsWith(".json") ? location : `${location}/registry.json`,
  );
  const root = dirname(file);
  return {
    registry: JSON.parse(await readFile(file, "utf8")),
    read: async (path: string) =>
      readFile(await safeDestination(root, path), "utf8"),
  };
}
/** Resolve registry dependencies in installation order, rejecting cycles. */
export function resolveItems(
  registry: Registry,
  names: string[],
): RegistryItem[] {
  if (!Array.isArray(registry.items))
    throw Error("Registry must contain an items array");
  const items = new Map(registry.items.map((item) => [item.name, item]));
  const done = new Set<string>();
  const visiting = new Set<string>();
  const result: RegistryItem[] = [];
  function visit(name: string) {
    if (done.has(name)) return;
    if (visiting.has(name)) throw Error(`Registry dependency cycle at ${name}`);
    const item = items.get(name);
    if (!item) throw Error(`Unknown registry item: ${name}`);
    visiting.add(name);
    for (const dep of item.registryDependencies ?? []) {
      if (!dep.startsWith("moyarich/moyaforge/"))
        throw Error(`Unsupported external registry dependency: ${dep}`);
      visit(dep.slice("moyarich/moyaforge/".length).split("#")[0]);
    }
    visiting.delete(name);
    done.add(name);
    result.push(item);
  }
  names.forEach(visit);
  return result;
}
/** Plan component installation without changing the consumer project. */
export async function planItems({
  root,
  names,
  registry,
  directory = defaultDirectory,
}: {
  root: string;
  names: string[];
  registry?: string;
  directory?: string;
}): Promise<InstallPlan & { items: string[]; instructions: string[] }> {
  const source = await loadRegistry(registry);
  const items = resolveItems(source.registry, names);
  const files = new Map<string, PlannedFile>();
  const dependencies = new Set<string>();
  for (const item of items) {
    for (const dep of item.dependencies ?? []) {
      if (
        typeof dep !== "string" ||
        !/^(?:@[a-z\d][a-z\d._-]*\/)?[a-z\d][a-z\d._-]*(?:@[^\s]+)?$/i.test(
          dep,
        ) ||
        /(?:file:|git|https?:)/i.test(dep)
      )
        throw Error(`Invalid npm registry dependency: ${dep}`);
      dependencies.add(dep);
    }
    for (const file of item.files ?? []) {
      // Component files follow the configured UI directory; sibling shared
      // utilities remain siblings so relative imports continue to resolve.
      const targetPath = file.target;
      if (typeof file.path !== "string" || typeof targetPath !== "string")
        throw Error(`Unsupported registry file target: ${targetPath}`);
      const uiPrefix = `~/${defaultDirectory}/`;
      const sharedPrefix = "~/src/components/utils/";
      let destination: string;
      let suffix: string;
      if (targetPath.startsWith(uiPrefix)) {
        suffix = targetPath.slice(uiPrefix.length);
        destination = resolve(root, directory, suffix);
      } else if (targetPath.startsWith(sharedPrefix)) {
        suffix = targetPath.slice(sharedPrefix.length);
        destination = resolve(root, directory, "..", "utils", suffix);
      } else {
        throw Error(`Unsupported registry file target: ${targetPath}`);
      }
      if (!suffix || suffix.split(/[\\/]/).includes("..") || isAbsolute(suffix) || suffix.includes("\\"))
        throw Error(`Invalid component target: ${suffix}`);
      const target = await safeDestination(root, destination);
      const content =
        typeof file.content === "string"
          ? file.content
          : await source.read(file.path);
      if (files.has(target) && files.get(target)!.content !== content)
        throw Error(`Conflicting registry files for ${target}`);
      files.set(target, {
        path: target,
        content,
        previous: await readOptional(target),
      });
    }
  }
  return {
    files: [...files.values()],
    dependencies: [...dependencies],
    items: items.map((item) => item.name),
    instructions: items.flatMap((item) =>
      typeof item.docs === "string" && item.docs.trim() ? [item.docs] : [],
    ),
  };
}
/** Describe proposed writes, preserved edits, and required dependencies. */
export function reportPlan(
  plan: InstallPlan,
  {
    root,
    diff = false,
    overwrite = false,
    log = console.log,
  }: {
    root: string;
    diff?: boolean;
    overwrite?: boolean;
    log?: (message: string) => void;
  },
) {
  for (const file of plan.files) {
    const state =
      file.previous === undefined
        ? "create"
        : file.previous === file.content
          ? "unchanged"
          : file.merge
            ? "merge"
            : overwrite
              ? "replace"
              : "preserve";
    log(`${state}: ${relative(root, file.path)}`);
    if (diff && file.previous !== undefined && file.previous !== file.content) {
      log(
        `--- current/${relative(root, file.path)}\n${file.previous}\n+++ registry/${relative(root, file.path)}\n${file.content}`,
      );
    }
  }
  if (plan.dependencies.length)
    log(`npm dependencies: ${plan.dependencies.join(", ")}`);
}
/** Validate the complete plan before writing; preserve edits unless authorized. */
export async function applyPlan(
  plan: InstallPlan,
  { root, overwrite = false }: { root: string; overwrite?: boolean },
) {
  // Complete validation before any mutation. Existing edits are preserved unless explicitly replaced.
  for (const file of plan.files) {
    await safeDestination(root, file.path);
    if ((await readOptional(file.path)) !== file.previous)
      throw Error(`File changed while planning: ${file.path}`);
  }
  for (const file of plan.files) {
    if (
      file.previous !== undefined &&
      ((!overwrite && !file.merge) || file.previous === file.content)
    )
      continue;
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, {
      flag: file.previous === undefined ? "wx" : "w",
    });
  }
}
/** Install npm dependencies after planned source writes have succeeded. */
export function installDependencies(
  root: string,
  dependencies: string[],
  dev = false,
  allowEmpty = false,
) {
  if (!dependencies.length && !allowEmpty) return;
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(
    command,
    ["install", ...(dev ? ["--save-dev"] : []), ...dependencies],
    { cwd: root, stdio: "inherit", shell: false },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw Error(
      `npm install failed (${result.status}). Files are preserved; retry dependency installation.`,
    );
}
