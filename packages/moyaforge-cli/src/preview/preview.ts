import { runVite } from "../utils/vite.js";

/** Execute the consumer's preview command. */
export async function preview(args: string[]): Promise<void> {
  await runVite("preview", args);
}
