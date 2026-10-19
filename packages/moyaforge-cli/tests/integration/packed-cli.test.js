import { test, expect } from "vitest";
import { mkdtemp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "../../../..");
const packageRoot = resolve(import.meta.dirname, "../..");

// Exercise the built package outside the repository so source files cannot mask
// broken bin paths, package exports, or template locations.
test("packed CLI runs init using only compiled files and packaged templates", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "moyaforge-packed-cli-"));
  const run = (command, args, cwd = temporary) => {
    const result = spawnSync(command, args, { cwd, encoding: "utf8" });
    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
    return result.stdout;
  };
  try {
    const metadata = JSON.parse(
      run(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary],
        packageRoot,
      ),
    );
    const packed = Array.isArray(metadata)
      ? metadata[0]
      : Object.values(metadata)[0];
    expect(packed.files.some((file) => file.path.startsWith("src/"))).toBe(
      false,
    );
    expect(
      packed.files.some((file) => file.path === "dist/registry.d.ts"),
    ).toBe(true);
    run("tar", ["-xzf", join(temporary, packed.filename), "-C", temporary]);
    expect(
      packed.files.some((file) => file.path === "dist/commands/usage.js"),
    ).toBe(true);
    const cli = join(temporary, "package/dist/bin/moyaforge.js");
    const manifest = JSON.parse(
      await readFile(join(packageRoot, "package.json"), "utf8"),
    );
    expect(run(process.execPath, [cli, "--help"])).toContain(
      "Usage: moyaforge",
    );
    expect(run(process.execPath, [cli, "--version"]).trim()).toBe(
      manifest.version,
    );
    const consumer = join(temporary, "consumer");
    await mkdir(consumer);
    run(process.execPath, [
      cli,
      "init",
      "--cwd",
      consumer,
      "--registry",
      repository,
      "--no-install",
    ]);
    expect(await readFile(join(consumer, "vite.config.ts"), "utf8")).toContain(
      "defineConfig",
    );
    expect(await readFile(join(consumer, "src/App.tsx"), "utf8")).not.toContain(
      "__UI__",
    );
    expect((await stat(cli)).mode & 0o111).not.toBe(0);
    const api = await import(
      pathToFileURL(join(temporary, "package/dist/registry.js")).href
    );
    expect(typeof api.planItems).toBe("function");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 30000);
