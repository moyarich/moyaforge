import { format } from "prettier";
import {
  buildItem,
  createContext,
  discoverSpecs,
  type RegistryItem,
  type RegistryComponentSource,
} from "./registry-source.ts";
import { updateRegistryOutput } from "./output.ts";

/** Paths are relative to the workspace root supplied by the caller. */
export interface BuildRegistryOptions {
  name?: string;
  homepage?: string;
  check?: boolean;
  packages?: readonly RegistryComponentSource[];
  dependencyManifests?: readonly string[];
  templatesDir?: string | false;
  docsDir?: string | false;
  outputFile?: string;
  targetDir?: string;
  legacyStylesDir?: string | false;
}

export async function buildRegistry(
  root: string,
  {
    name = "registry",
    homepage,
    check = false,
    outputFile = "registry.json",
    legacyStylesDir = false,
    ...sources
  }: BuildRegistryOptions = {},
) {
  const context = await createContext(root, sources);
  const specs = await discoverSpecs(context);
  const items: RegistryItem[] = [];
  for (const [name, spec] of [...specs].sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  )) {
    items.push(await buildItem(context, name, spec));
  }

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name,
    ...(homepage ? { homepage } : {}),
    items,
  };
  const output = await format(JSON.stringify(registry, null, 2), {
    parser: "json",
  });
  await updateRegistryOutput(context.root, output, check, {
    outputFile,
    legacyStylesDir,
  });
  return registry;
}
