import { planItems } from "../registry.js";
import { executePlan } from "../utils/install-plan.js";
import { resolveConsumer, type InstallOptions } from "../utils/consumer.js";
import { listComponents } from "../list/list.js";

export async function addComponent(names: string[], options: InstallOptions): Promise<void> {
  if (!names.length) return listComponents(options);
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(await planItems({ root, registry, directory, names }), options, root, "components");
}
