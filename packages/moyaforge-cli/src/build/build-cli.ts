import { Command } from "commander";
import { runVite } from "../cli/vite.js";

export function buildCommand(): Command {
  const cmd = new Command("build")
    .description("Build using Vite")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = cmd.parent?.rawArgs ?? process.argv;
    const at = argv.indexOf("build", 2);
    await runVite("build", argv.slice(at + 1));
  });
}
