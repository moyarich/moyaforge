import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { addComponentCommand } from "./add-cli.js";
import { listComponentsCommand } from "./list-cli.js";

import { createCommand } from "./create-cli.js";
import { initCommand } from "./init-cli.js";
import { devCommand } from "./dev-cli.js";
import { previewCommand } from "./preview-cli.js";

/** Construct an independent root CLI with all supported subcommands. */
export function createRootCliCommand(): Command {
  const program = new Command()
    .name("moyaforge")
    .description("Create MoyaForge documentation sites and install editable components.");
  program.addCommand(initCommand());
  program.addCommand(createCommand());
  program.addCommand(addComponentCommand());
  program.addCommand(listComponentsCommand());
  program.addCommand(devCommand());
  program.addCommand(previewCommand());
  return program;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const metadata = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const program = createRootCliCommand().version(metadata.version, "-v, --version");
  if (argv.length <= 2) {
    program.outputHelp();
    return;
  }
  await program.parseAsync(argv);
}
