import { runVite } from "../utils/vite.js";

/** Execute the consumer's build command. */
export async function build(args: string[]): Promise<void> {
  await runVite("build", args);
}
