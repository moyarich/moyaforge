import { Command } from "commander";
import { addComponent } from "./add.js";

export function addComponentCommand(): Command {
  return new Command("add")
    .description("Install editable registry components")
    .argument("[items...]", "Registry item names")
    .option("--cwd <path>", "Consumer project directory")
    .option("--registry <source>", "Registry directory or registry.json URL")
    .option("--directory <path>", "Component destination")
    .option("--dry-run", "Preview without writing")
    .option("--diff", "Show changes")
    .option("--overwrite", "Replace existing files")
    .option("--no-install", "Skip npm dependencies")
    .action(addComponent);
}
