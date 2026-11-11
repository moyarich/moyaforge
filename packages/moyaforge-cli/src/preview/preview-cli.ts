import { Command } from "commander";
import { preview } from "./preview.js";

export function previewCommand(): Command {
  const cmd = new Command("preview")
    .description("Preview the Vite build")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = cmd.parent?.rawArgs ?? process.argv;
    const at = argv.indexOf("preview", 2);
    await preview(argv.slice(at + 1));
  });
}
