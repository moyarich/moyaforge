import { Command } from "commander";
import { runVite } from "../cli/vite.js";

export function devCommand(): Command {
  const cmd = new Command("dev")
    .description("Start Vite")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = cmd.parent?.rawArgs ?? process.argv;
    const at = argv.indexOf("dev", 2);
    await runVite("dev", argv.slice(at + 1));
  });
}
