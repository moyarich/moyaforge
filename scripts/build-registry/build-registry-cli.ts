#!/usr/bin/env node
import { stat } from "node:fs/promises";
import { Command } from "commander";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildRegistry, type BuildRegistryOptions } from "./build-registry.ts";

interface CliOptions {
  config?: string;
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
  printOutput: boolean;
}

const append = (value: string, entries: string[]) => [...entries, value];

await new Command()
  .name("build-registry")
  .description("Generate a component registry from registry.config.ts or CLI options")
  .option(
    "--config <path>",
    "Explicit config file (auto-detect registry.config.ts when omitted)",
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
  .option("--print-output", "Print the effective output filename without generating files", false)
  .action(async (options: CliOptions) => {
    const configPath = resolve(
      process.cwd(),
      options.config ?? "registry.config.ts",
    );
    const hasConfig = await stat(configPath).then(
      (info) => info.isFile(),
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return false;
        throw error;
      },
    );

    if (options.config && !hasConfig)
      throw Error(`Registry config file not found: ${configPath}`);

    const configured: BuildRegistryOptions = hasConfig
      ? ((await import(pathToFileURL(configPath).href)) as {
          default: BuildRegistryOptions;
        }).default
      : {};

    if (!configured || typeof configured !== "object")
      throw Error(`Invalid registry configuration: ${configPath}`);

    const packages = options.package.length
      ? options.package.map(
          (packagePath) =>
            configured.packages?.find(
              (source) => source.packagePath === packagePath,
            ) ?? { packagePath },
        )
      : (configured.packages ?? []);

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
      outputFile: options.outputFile ?? configured.outputFile,
      targetDir: options.targetDir ?? configured.targetDir,
      check: options.check ?? configured.check,
    };

    if (options.printOutput) {
      console.log(settings.outputFile ?? "registry.json");
      return;
    }

    if (!packages.length)
      throw Error(
        "No component packages configured. Use --package <directory> or provide registry.config.ts with a packages list.",
      );

    const root = hasConfig ? dirname(configPath) : process.cwd();
    const registry = await buildRegistry(root, settings);
    console.log(
      `Validated ${registry.items.length} automatically discovered registry items.`,
    );
  })
  .parseAsync();
