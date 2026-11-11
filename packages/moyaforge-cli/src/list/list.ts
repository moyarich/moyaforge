import { resolveConsumer, type InstallOptions } from "../utils/consumer.js";
import { loadRegistry } from "../registry.js";

export async function listComponents(options: InstallOptions): Promise<void> {
  const { registry } = await resolveConsumer(options);
  const { registry: source } = await loadRegistry(registry);
  for (const item of source.items)
    console.log(`${item.name}: ${item.description ?? item.title ?? ""}`);
}
