import type { Command } from "commander";
import { withInstallOptions } from "../cli/options.js";
import { runInstall, type InstallOptions } from "../cli/install.js";

/** Install one or more registry items into a consumer project. */
export function registerAdd(program: Command) {
  withInstallOptions(program.command("add").description("Install editable registry components"))
    .argument("[items...]", "Registry item names")
    .action(async (names: string[], _options: InstallOptions, command: Command) => {
      await runInstall("add", command.opts<InstallOptions>(), names);
    });
}
