import type { InstallPlan } from "../types.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

export interface InstallOptions {
  cwd?: string;
  registry?: string;
  directory?: string;
  mode?: "source" | "package";
  template?: "docs" | "hybrid" | "playground" | "existing";
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

import { applyPlan, defaultRegistry, defaultDirectory, installDependencies, readOptional, reportPlan } from "../registry.js";

/** Apply a command-created plan, with safety and npm installation handled centrally. */
export async function executePlan(
  plan: InstallPlan, options: InstallOptions, root: string,
  kind: "configuration" | "project" | "components",
): Promise<void> {
  reportPlan(plan, { root, diff: options.diff, overwrite: options.overwrite });
  const notes = () => {
    if (plan.instructions?.length)
      console.log(`\nSetup notes:\n\n${plan.instructions.join("\n\n")}`);
  };
  if (options.dryRun) {
    notes();
    console.log("Dry run: no files or dependencies changed.");
    return;
  }
  if (kind === "components" && !existsSync(resolve(root, "package.json")) && options.install !== false)
    throw Error("No package.json found. Run init first, or use --no-install to copy source only.");

  await applyPlan(plan, { root, overwrite: options.overwrite });
  if (options.install !== false) {
    if (kind === "project") installDependencies(root, [], false, true);
    else if (kind === "components") {
      const manifest = JSON.parse((await readOptional(resolve(root, "package.json"))) ?? "{}");
      const declared = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
      installDependencies(root, plan.dependencies.filter(spec => !declared[spec.replace(/@[^@/]+$/, "")]));
    }
  }
  console.log(kind === "project"
    ? "MoyaForge app created. Run npm install if skipped, then npm run dev (or npm run docs:dev for an existing app)."
    : kind === "configuration"
      ? "MoyaForge configured. Use moyaforge add to install components."
      : "Components installed. Import the component source; styles are loaded automatically.");
  notes();
}
