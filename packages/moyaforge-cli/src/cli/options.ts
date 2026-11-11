import { Command, Option } from "commander";

/** Shared CLI flags; Commander owns help, validation and negated booleans. */
export function withInstallOptions(command: Command) {
  return command
    .option("--cwd <path>", "Consumer project directory")
    .option("--registry <source>", "Local registry directory or registry.json URL")
    .option("--directory <path>", "Component installation directory")
    .addOption(new Option("--mode <mode>", "Source or npm-managed UI").choices(["source", "package"]))
    .addOption(new Option("--template <template>", "Documentation starter template").choices(["docs", "hybrid", "existing"]))
    .option("--search", "Include the SQLite search adapter")
    .option("--dry-run", "Show the installation plan without writing")
    .option("--diff", "Print a diff of proposed changes")
    .option("--overwrite", "Replace existing generated files")
    .option("--no-install", "Skip npm dependency installation");
}
