import { Command } from "commander";
import { listComponents } from "./list.js";

export function listComponentsCommand(): Command {
  return new Command("list")
    .description("List available registry items")
    .option("--cwd <path>", "Consumer project directory")
    .option("--registry <source>", "Registry directory or registry.json URL")
    .action(listComponents);
}
