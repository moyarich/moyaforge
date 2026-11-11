import { Command, Option } from "commander";
import { createProject } from "./create.js";

export function createCommand(): Command {
  return new Command("create")
    .description("Generate a React/Vite/MDX documentation site")
    .option("--cwd <path>", "Consumer project directory")
    .option("--registry <source>", "Registry directory or registry.json URL")
    .option("--directory <path>", "Component destination")
    .addOption(new Option("--mode <mode>").choices(["source", "package"]))
    .addOption(new Option("--template <template>").choices(["docs", "hybrid", "existing"]))
    .option("--search", "Include SQLite search")
    .option("--dry-run", "Preview without writing")
    .option("--diff", "Show changes")
    .option("--overwrite", "Replace existing files")
    .option("--no-install", "Skip npm install")
    .action(createProject);
}
