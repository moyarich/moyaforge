import { planConfiguration } from "./scaffold.js";
import {
  executePlan,
  resolveConsumer,
  type InstallOptions,
} from "./install-plan.js";
import { createProject } from "./create-project.js";

/**
 * Initialize component registry configuration in an existing project.
 * Supplying a template, mode or enabled search delegates to project scaffolding.
 * @param options - Consumer project and installation controls.
 * @returns A promise that resolves when initialization completes.
 * @example await initializeProject({ cwd: ".", dryRun: true });
 */
export async function initializeProject(
  options: InstallOptions,
): Promise<void> {
  if (
    options.template !== undefined ||
    options.mode !== undefined ||
    options.search
  ) {
    await createProject(options);
    return;
  }
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(
    await planConfiguration({ root, registry, directory }),
    options,
    root,
    "configuration",
  );
}
