import { planComponentInstallation } from "../registry/registry.js";
import {
  executePlan,
  resolveConsumer,
  type InstallOptions,
} from "./install-plan.js";
import { listComponents } from "../registry/list.js";

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
