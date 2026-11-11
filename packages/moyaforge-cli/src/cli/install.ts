import type { InstallPlan } from "../types.js";
import type { ScaffoldOptions } from "../scaffold.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import {
  applyPlan, defaultRegistry, defaultDirectory, installDependencies,
  loadRegistry, planItems, readOptional, reportPlan,
} from "../registry.js";
import { planConfiguration, planProject } from "../scaffold.js";

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

/** Resolve the consumer's configured registry without requiring a project build. */
export async function resolveConsumer(values: InstallOptions) {
  const root = resolve(values.cwd ?? ".");
  if (!existsSync(root)) throw Error(`Project directory does not exist: ${root}`);
  const config = JSON.parse(
    (await readOptional(resolve(root, "moyaforge.components.json"))) ?? "{}",
  );
  const selectedRegistry = values.registry ?? config.registry ?? defaultRegistry;
  if (typeof selectedRegistry !== "string") throw Error("Invalid registry setting");
  const registry = /^https?:\/\//.test(selectedRegistry)
    ? selectedRegistry
    : resolve(values.registry ? process.cwd() : root, selectedRegistry);
  const directory = values.directory ?? config.directory ?? defaultDirectory;
  if (typeof directory !== "string") throw Error("Invalid component directory setting");
  return { root, registry, directory };
}

export async function runInstall(command: "init" | "create" | "add" | "list", values: InstallOptions, positionals: string[]) {
  const { root, registry, directory } = await resolveConsumer(values);
  if (command === "add" && !positionals.length) {
    const { registry: source } = await loadRegistry(registry);
    for (const item of source.items)
      console.log(`${item.name}: ${item.description ?? item.title ?? ""}`);
    return;
  }
  const options = { root, names: positionals, registry, directory };
  let plan: InstallPlan;
  const createsProject = command === "create" || (command === "init" && (values.template !== undefined || values.mode !== undefined || values.search));
  if (createsProject) {
    const mode = values.mode ?? "source";
    const project = await planProject({
      ...options,
      mode: mode as ScaffoldOptions["mode"],
      template: values.template as ScaffoldOptions["template"],
      search: values.search,
    });
    const components = await planItems({
      ...options,
      names: ["docs-shell", "code-group"],
    });
    plan = {
      files: [...components.files, ...project.files],
      dependencies: project.dependencies,
      instructions: components.instructions,
    };
  } else if (command === "init") plan = await planConfiguration(options);
  else plan = await planItems(options);
  reportPlan(plan, { root, diff: values.diff, overwrite: values.overwrite });
  const printSetupNotes = () => {
    if (plan.instructions?.length)
      console.log(`\nSetup notes:\n\n${plan.instructions.join("\n\n")}`);
  };
  if (values.dryRun) {
    printSetupNotes();
    console.log("Dry run: no files or dependencies changed.");
    return;
  }
  if (
    !existsSync(resolve(root, "package.json")) &&
    !["init", "create"].includes(command) &&
    values.install !== false
  )
    throw Error(
      "No package.json found. Run init first, or use --no-install to copy source only.",
    );
  await applyPlan(plan, { root, overwrite: values.overwrite });
  if (values.install !== false) {
    if (createsProject) installDependencies(root, [], false, true);
    else {
      const manifest = JSON.parse(
        (await readOptional(resolve(root, "package.json"))) ?? "{}",
      );
      const declared = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      };
      const missing = plan.dependencies.filter(
        (spec) => !declared[spec.replace(/@[^@/]+$/, "")],
      );
      installDependencies(root, missing);
    }
  }
  console.log(
    createsProject
      ? "MoyaForge app created. Run npm install if skipped, then npm run dev (or npm run docs:dev for an existing app)."
      : command === "init" ? "MoyaForge configured. Use moyaforge add to install components." : "Components installed. Import the component source; styles are loaded automatically.",
  );
  printSetupNotes();
}


