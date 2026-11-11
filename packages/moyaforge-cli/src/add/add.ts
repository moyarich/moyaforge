import { planComponentInstallation } from "../registry.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../utils/install-plan.js";
import { listComponents } from "../list/list.js";

export async function addComponent(names: string[], options: InstallOptions): Promise<void> {
  if (!names.length) return listComponents(options);
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(await planComponentInstallation({ root, registry, directory, names }), options, root, "components");
}
