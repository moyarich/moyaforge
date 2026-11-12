#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { buildRegistry } from "../scripts/build-registry/build-registry.ts";

await new Command()
  .name("build-registry")
  .description("Generate the component registry from source files")
  .option("--check", "Verify the generated registry without writing files")
  .action(async ({ check }: { check?: boolean }) => {
    const registry = await buildRegistry(resolve(import.meta.dirname, ".."), {
      check,
    });
    console.log(
      `Validated ${registry.items.length} automatically discovered registry items.`,
    );
  })
  .parseAsync();
