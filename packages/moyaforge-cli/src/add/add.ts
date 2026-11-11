import { planItems } from "../registry.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../cli/install.js";
import { listComponents } from "../list/list.js";

export async function addComponent(names: string[], options: InstallOptions): Promise<void> {
  if (!names.length) return listComponents(options);
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(await planItems({ root, registry, directory, names }), options, root, "components");
}
