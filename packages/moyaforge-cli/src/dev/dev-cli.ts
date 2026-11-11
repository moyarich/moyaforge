import { Command } from "commander";
import { dev } from "./dev.js";

export function devCommand(): Command {
  const cmd = new Command("dev")
    .description("Start Vite")
    .allowUnknownOption(true)
    .argument("[args...]", "Vite arguments")
    .option("--cwd <path>", "Consumer project directory");
  return cmd.action(async () => {
    const argv = process.argv;
    const at = argv.indexOf("dev", 2);
    await dev(argv.slice(at + 1));
  });
}
