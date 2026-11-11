import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { defaultRegistry, defaultDirectory, readOptional } from "../registry.js";

export interface InstallOptions {
  cwd?: string;
  registry?: string;
  directory?: string;
  mode?: "source" | "package";
  template?: "docs" | "hybrid" | "existing";
  search?: boolean;
  dryRun?: boolean;
  diff?: boolean;
  overwrite?: boolean;
  install?: boolean;
}

export async function resolveConsumer(options: InstallOptions) {
  const root = resolve(options.cwd ?? ".");
  if (!existsSync(root)) throw Error(`Project directory does not exist: ${root}`);
  const config = JSON.parse((await readOptional(resolve(root, "moyaforge.components.json"))) ?? "{}");
  const source = options.registry ?? config.registry ?? defaultRegistry;
  if (typeof source !== "string") throw Error("Invalid registry: expected a string");
  const registry = /^https?:\/\//.test(source)
    ? source : resolve(options.registry ? process.cwd() : root, source);
  const directory = options.directory ?? config.directory ?? defaultDirectory;
  if (typeof directory !== "string") throw Error("Invalid directory: expected a string");
  return { root, registry, directory };
}

