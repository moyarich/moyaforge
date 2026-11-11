import { runVite } from "../utils/vite.js";

/** Execute the consumer's dev command. */
export async function dev(args: string[]): Promise<void> {
  await runVite("dev", args);
}
