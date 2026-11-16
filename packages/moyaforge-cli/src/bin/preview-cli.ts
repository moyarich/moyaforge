import { Command } from "commander";
import { runVite } from "../run-vite/run-vite.js";

export function previewCommand(): Command {
  const cmd = new Command("preview")
    .description("Preview the Vite build")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = process.argv;
    const at = argv.indexOf("preview", 2);
    process.exitCode = await runVite("preview", argv.slice(at + 1));
  });
}
