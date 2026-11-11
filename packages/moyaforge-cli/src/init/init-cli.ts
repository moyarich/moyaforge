import { Command, Option } from "commander";
import { initializeProject } from "./init.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Configure a project; legacy template flags create a site")
    .option("--cwd <path>", "Consumer project directory")
    .option("--registry <source>", "Registry directory or registry.json URL")
    .option("--directory <path>", "Component destination")
    .addOption(new Option("--mode <mode>").choices(["source", "package"]))
    .addOption(new Option("--template <template>").choices(["docs", "hybrid", "existing"]))
    .option("--search", "Legacy starter with SQLite search")
    .option("--dry-run", "Preview without writing")
    .option("--diff", "Show changes")
    .option("--overwrite", "Replace existing files")
    .option("--no-install", "Skip npm install")
    .action(initializeProject);
}
