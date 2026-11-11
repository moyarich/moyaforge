import type { InstallPlan } from "../types.js";
import type { InstallOptions } from "./consumer.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { applyPlan, installDependencies, readOptional, reportPlan } from "../registry.js";

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
