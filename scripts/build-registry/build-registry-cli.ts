#!/usr/bin/env node
import { Command } from "commander";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildRegistry, type BuildRegistryOptions } from "./build-registry.ts";

interface CliOptions {
  check: boolean;
  config: string;
  package: string[];
  printOutput: boolean;
}

await new Command()
  .name("build-registry")
  .description("Generate the component registry using registry.config.ts")
  .option("--check", "Verify generated output without writing files", false)
  .option(
    "--config <path>",
    "Registry config file (resolved from the current directory)",
    "registry.config.ts",
  )
  .option(
    "--package <directory>",
    "Override configured component packages (repeatable)",
    (value: string, packages: string[]) => [...packages, value],
    [] as string[],
  )
  .option(
    "--print-output",
    "Print configured registry output path without generating files",
    false,
  )
  .action(async (options: CliOptions) => {
    const configPath = resolve(process.cwd(), options.config);
    const { default: configured } = (await import(
      pathToFileURL(configPath).href
    )) as { default: BuildRegistryOptions };
    if (!configured || !Array.isArray(configured.packages) || !configured.packages.length)
      throw Error(`Registry config must declare a nonempty packages list: ${configPath}`);

    if (options.printOutput) {
      console.log(configured.outputFile ?? "registry.json");
      return;
    }

    const packages = options.package.length
      ? options.package.map(
          (packagePath) =>
            configured.packages!.find((source) => source.packagePath === packagePath)
            ?? { packagePath },
        )
      : configured.packages;

    const registry = await buildRegistry(dirname(configPath), {
      ...configured,
      packages,
      check: options.check,
    });
    console.log(
      `Validated ${registry.items.length} automatically discovered registry items.`,
    );
  })
  .parseAsync();
