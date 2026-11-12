import { format } from "prettier";
import {
  buildItem,
  createContext,
  discoverSpecs,
  type RegistryItem,
} from "./registry-source.ts";
import { updateRegistryOutput } from "./output.ts";

export async function buildRegistry(root: string, { check = false } = {}) {
  const context = await createContext(root);
  const specs = await discoverSpecs(context);
  const items: RegistryItem[] = [];
  for (const [name, spec] of [...specs].sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  )) {
    items.push(await buildItem(context, name, spec));
  }

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "moyaforge",
    homepage: "https://github.com/moyarich/moyaforge",
    items,
  };
  const output = await format(JSON.stringify(registry, null, 2), {
    parser: "json",
  });
  await updateRegistryOutput(context.root, output, check);
  return registry;
}
