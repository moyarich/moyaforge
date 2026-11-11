import { Command } from "commander";
import { runVite } from "../cli/vite.js";

export function previewCommand(): Command {
  const cmd = new Command("preview")
    .description("Preview the Vite build")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = cmd.parent?.rawArgs ?? process.argv;
    const at = argv.indexOf("preview", 2);
    await runVite("preview", argv.slice(at + 1));
  });
}
