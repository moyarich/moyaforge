import type { Command } from "commander";
import { withInstallOptions } from "../cli/options.js";
import { resolveConsumer, type InstallOptions } from "../cli/install.js";
import { loadRegistry } from "../registry.js";

/** List registry entries without planning any file writes. */
export function registerList(program: Command) {
  withInstallOptions(program.command("list").description("List available registry components"))
    .action(async (_options: InstallOptions, command: Command) => {
      const { registry } = await resolveConsumer(command.opts<InstallOptions>());
      const { registry: source } = await loadRegistry(registry);
      for (const item of source.items)
        console.log(`${item.name}: ${item.description ?? item.title ?? ""}`);
    });
}
