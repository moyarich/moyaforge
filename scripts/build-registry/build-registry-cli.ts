#!/usr/bin/env node
import { Command } from "commander";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildRegistry, type BuildRegistryOptions } from "./build-registry.ts";

interface CliOptions {
  config: string;
  check?: boolean;
  package: string[];
  dependencyManifest: string[];
  name?: string;
  homepage?: string;
  templatesDir?: string;
  templates?: boolean;
  docsDir?: string;
  docs?: boolean;
  outputFile?: string;
  targetDir?: string;
  legacyStylesDir?: string;
  legacyStyles?: boolean;
  printOutput: boolean;
}

const append = (value: string, entries: string[]) => [...entries, value];

await new Command()
  .name("build-registry")
  .description("Generate a component registry using registry.config.ts and optional overrides")
  .option(
    "--config <path>",
    "Registry config file, relative to the current directory",
    "registry.config.ts",
  )
  .option("--check", "Verify generated output without writing files")
  .option("--name <name>", "Override the registry name")
  .option("--homepage <url>", "Override the registry homepage")
  .option(
    "--package <directory>",
    "Select a component package (repeatable; preserves configured name overrides)",
    append,
    [] as string[],
  )
  .option(
    "--dependency-manifest <path>",
    "Override shared dependency manifests (repeatable)",
    append,
    [] as string[],
  )
  .option("--templates-dir <directory>", "Override the registry template directory")
  .option("--no-templates", "Skip registry templates")
  .option("--docs-dir <directory>", "Override the registry documentation directory")
  .option("--no-docs", "Skip registry documentation")
  .option("--output-file <path>", "Override the generated registry filename")
  .option("--target-dir <path>", "Override component installation targets")
  .option("--legacy-styles-dir <directory>", "Override the legacy styles cleanup directory")
  .option("--no-legacy-styles", "Disable legacy styles cleanup")
  .option("--print-output", "Print the effective output filename without generating files", false)
  .action(async (options: CliOptions) => {
    const configPath = resolve(process.cwd(), options.config);
    const { default: configured } = (await import(
      pathToFileURL(configPath).href
    )) as { default: BuildRegistryOptions };

    if (!configured || !Array.isArray(configured.packages) || !configured.packages.length)
      throw Error(`Registry config must declare a nonempty packages list: ${configPath}`);

    const packages = options.package.length
      ? options.package.map(
          (packagePath) =>
            configured.packages!.find((source) => source.packagePath === packagePath)
            ?? { packagePath },
        )
      : configured.packages;

    const settings: BuildRegistryOptions = {
      ...configured,
      packages,
      ...(options.name !== undefined && { name: options.name }),
      ...(options.homepage !== undefined && { homepage: options.homepage }),
      ...(options.dependencyManifest.length > 0 && {
        dependencyManifests: options.dependencyManifest,
      }),
      templatesDir: options.templates === false
        ? false
        : (options.templatesDir ?? configured.templatesDir),
      docsDir: options.docs === false
        ? false
        : (options.docsDir ?? configured.docsDir),
      legacyStylesDir: options.legacyStyles === false
        ? false
        : (options.legacyStylesDir ?? configured.legacyStylesDir),
      outputFile: options.outputFile ?? configured.outputFile,
      targetDir: options.targetDir ?? configured.targetDir,
      check: options.check ?? configured.check,
    };

    if (options.printOutput) {
      console.log(settings.outputFile ?? "registry.json");
      return;
    }

    const registry = await buildRegistry(dirname(configPath), settings);
    console.log(
      `Validated ${registry.items.length} automatically discovered registry items.`,
    );
  })
  .parseAsync();
