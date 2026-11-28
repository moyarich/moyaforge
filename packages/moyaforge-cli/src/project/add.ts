import { planComponentInstallation } from "../registry/registry.js";
import {
  executePlan,
  resolveConsumer,
  type InstallOptions,
} from "./install-plan.js";
import { listComponents } from "../registry/list.js";

/**
 * Install selected registry components into a consumer project.
 * Resolves component dependencies and reports or applies the installation plan.
 * An empty selection lists available components instead.
 * @param names - Registry component names.
 * @param options - Project location, registry and installation controls.
 * @returns A promise that resolves after listing or installation completes.
 * @example await addComponent(["card"], { dryRun: true });
 */
export async function addComponent(
  names: string[],
  options: InstallOptions,
): Promise<void> {
  if (!names.length) return listComponents(options);
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(
    await planComponentInstallation({ root, registry, directory, names }),
    options,
    root,
    "components",
  );
}
