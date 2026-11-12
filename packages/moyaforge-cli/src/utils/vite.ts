import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

export async function runVite(command: "dev" | "preview", args: string[]) {
  const at = args.indexOf("--cwd");
  const root = resolve(at >= 0 ? (args[at + 1] ?? ".") : ".");
  const forwarded =
    at >= 0
      ? args.filter((_, index) => index !== at && index !== at + 1)
      : args;
  const vite = resolve(
    root,
    "node_modules/.bin",
    process.platform === "win32" ? "vite.cmd" : "vite",
  );
  if (!existsSync(vite))
    throw Error(
      "Vite is not installed. Run npm install in the consumer project.",
    );
  const config =
    !forwarded.includes("--config") &&
    existsSync(resolve(root, "moyaforge/vite.config.ts"))
      ? ["--config", "moyaforge/vite.config.ts"]
      : [];
  const result = spawnSync(
    vite,
    [...(command === "dev" ? [] : [command]), ...config, ...forwarded],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;

}
