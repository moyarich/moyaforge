import { test, expect } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, rm, lstat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "../../../..");
const packageRoot = resolve(import.meta.dirname, "../..");

/**
 * Validate the npm artifact as a consumer would use it: pack the built CLI,
 * install the tarball in a fresh project, and invoke the installed binary.
 * The source registry stays local so this test does not require GitHub access.
 */
test("npm installs the packed CLI and add copy-button installs registry source", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "moyaforge-npm-consumer-"));
  const consumer = join(temporary, "consumer");
  const run = (command, args, cwd) => {
    const result = spawnSync(command, args, {
      cwd,
      encoding: "utf8",
      timeout: 60000,
      env: { ...process.env, npm_config_update_notifier: "false" },
    });
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.status, [command, ...args, result.stdout, result.stderr].join("\n")).toBe(0);
    return result.stdout;
  };

  try {
    await mkdir(consumer);
    await writeFile(join(consumer, "package.json"), JSON.stringify({
      name: "moyaforge-npm-consumer",
      version: "0.0.0",
      private: true,
      type: "module",
    }, null, 2) + "\n");

    const pack = JSON.parse(run("npm", [
      "pack", "--ignore-scripts", "--json", "--pack-destination", temporary,
    ], packageRoot));
    const archive = join(temporary, pack[0].filename);
    expect(pack[0].files.some(file => file.path === "dist/bin/moyaforge.js")).toBe(true);
    expect(pack[0].files.some(file => file.path === "dist/registry.js")).toBe(true);

    run("npm", [
      "install", "--no-save", "--ignore-scripts",
      "--no-audit", "--no-fund", "--package-lock=false", archive,
    ], consumer);

    const installed = JSON.parse(await readFile(
      join(consumer, "node_modules/@moyarich/moyaforge-cli/package.json"), "utf8",
    ));
    expect(installed.name).toBe("@moyarich/moyaforge-cli");
    expect(installed.bin.moyaforge).toBe("./dist/bin/moyaforge.js");
    const binary = join(consumer, "node_modules/.bin", process.platform === "win32" ? "moyaforge.cmd" : "moyaforge");
    const binaryInfo = await lstat(binary);
    expect(binaryInfo.isFile() || binaryInfo.isSymbolicLink()).toBe(true);

    // Invoke the package's actual npm-installed executable, not the source tree.
    run("npm", [
      "exec", "--offline", "--no", "--", "moyaforge", "add", "copy-button",
      "--cwd", consumer, "--registry", repository, "--no-install",
    ], consumer);

    const destination = join(consumer, "src/components/ui/CopyButton");
    expect(await readFile(join(destination, "CopyButton.tsx"), "utf8")).toContain("CopyButton");
    expect(await readFile(join(destination, "CopyButton.css"), "utf8")).toBeTruthy();
    expect(await readFile(join(destination, "index.ts"), "utf8")).toBeTruthy();

    // Re-running must not overwrite consumer edits unless explicitly authorized.
    const customized = "// consumer customization\n";
    await writeFile(join(destination, "CopyButton.tsx"), customized);
    run("npm", [
      "exec", "--offline", "--no", "--", "moyaforge", "add", "copy-button",
      "--cwd", consumer, "--registry", repository, "--no-install",
    ], consumer);
    expect(await readFile(join(destination, "CopyButton.tsx"), "utf8")).toBe(customized);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 120000);
