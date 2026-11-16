#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { buildRegistry } from "./build-registry.ts";
import type { RegistryComponentSource } from "./registry-source.ts";

const defaultPackages: RegistryComponentSource[] = [
  { packagePath: "packages/moyaforge-ui" },
  {
    packagePath: "packages/moyaforge-monaco",
    nameOverrides: { MonacoEditorTypeFox: "monaco-editor-typefox" },
  },
];

await new Command()
  .name("build-registry")
  .description("Generate the component registry from source files")
  .option("--check", "Verify the generated registry without writing files")
  .option(
    "--package <directory>",
    "Include a workspace package's src/components (repeatable; overrides defaults)",
    (value: string, packages: string[]) => [...packages, value],
    [] as string[],
  )
  .action(async ({ check, package: packagePaths }: { check?: boolean; package: string[] }) => {
    const registry = await buildRegistry(
      resolve(import.meta.dirname, "../.."),
      {
        check,
        packages: packagePaths.length
          ? packagePaths.map((packagePath) => ({ packagePath }))
          : defaultPackages,
      },
    );
    console.log(
      `Validated ${registry.items.length} automatically discovered registry items.`,
    );
  })
  .parseAsync();
