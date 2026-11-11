import { Command } from "commander";
import { readOptional } from "../registry.js";
import { registerAdd } from "../add/index.js";
import { registerList } from "../list/index.js";
import { runInstall, type InstallOptions } from "./install.js";
import { withInstallOptions } from "./options.js";
import { runVite } from "./vite.js";

/** Configure CLI commands without coupling argument parsing to installation. */
export async function main(argv: string[] = process.argv) {
  const metadata = JSON.parse(
    (await readOptional(new URL("../../package.json", import.meta.url)))!,
  );
  const program = new Command()
    .name("moyaforge")
    .description("Create MoyaForge documentation sites and install editable components.")
    .version(metadata.version, "-v, --version");

  withInstallOptions(program.command("init")
    .description("Configure a project; legacy template flags create a site"))
    .action(async (_options: InstallOptions, command: Command) =>
      runInstall("init", command.opts<InstallOptions>(), []));

  withInstallOptions(program.command("create")
    .description("Generate a React/Vite/MDX documentation site"))
    .action(async (_options: InstallOptions, command: Command) =>
      runInstall("create", command.opts<InstallOptions>(), []));

  registerAdd(program);
  registerList(program);

  for (const action of ["dev", "build", "preview"] as const) {
    program.command(action)
      .description(`Run Vite ${action} in the consumer project`)
      .allowUnknownOption(true)
      .argument("[args...]", "Additional Vite options")
      .option("--cwd <path>", "Consumer project directory")
      .action(async () => {
        const at = argv.indexOf(action, 2);
        await runVite(action, argv.slice(at + 1));
      });
  }
  if (argv.length <= 2) {
    program.outputHelp();
    return;
  }
  await program.parseAsync(argv);
}
