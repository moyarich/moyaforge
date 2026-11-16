import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { test as base, type Page } from "@playwright/test";

const repo = resolve(import.meta.dirname, "../../../..");
const packageNames = [
  "moyaforge-mdx",
  "moyaforge",
  "moyaforge-search-sqlite",
  "moyaforge-cli",
] as const;

export interface ConsumerScenario {
  mode: "source" | "package";
  template: "docs" | "existing" | "hybrid";
  search: boolean;
}

export type ConsumerIndex =
  | "source-docs"
  | "package-docs-search"
  | "existing-app"
  | "hybrid-app";

interface PackedArtifacts {
  directory: string;
  cli: string;
  tarballs: Record<string, string>;
}

export interface PreparedConsumer {
  root: string;
  url: string;
  server: ChildProcess;
  scenario: ConsumerScenario;
}

export async function run(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => (stdout += data));
  child.stderr.on("data", (data) => (stderr += data));
  const [code] = await once(child, "exit");
  if (code !== 0)
    throw Error(
      `${command} ${args.join(" ")} failed (${code}) in ${cwd}\n${stdout}\n${stderr}`,
    );
  return stdout;
}

export async function waitForServer(url: string, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Vite may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error(`Consumer dev server did not start at ${url}`);
}

export function stopServer(server?: ChildProcess) {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // The server may already have exited.
  }
}

/**
 * Worker-scoped preparation: build and pack each workspace only once,
 * even when all four CLI consumer scenarios run in the same worker.
 * Setup has its own timeout; browser assertions retain the 60s test limit.
 */
export const test = base.extend<{}, { packedArtifacts: PackedArtifacts }>({
  packedArtifacts: [
    async ({}, use) => {
      const directory = await mkdtemp(
        join(tmpdir(), "moyaforge-packed-consumers-"),
      );
      try {
        const tarballs: Record<string, string> = {};
        for (const name of packageNames) {
          console.log(`Building and packing @moyarich/${name} for CLI consumers`);
          await run(
            "npm",
            ["run", "build", "--workspace", `@moyarich/${name}`],
            repo,
          );
          const packed = JSON.parse(
            await run(
              "npm",
              [
                "pack",
                "--ignore-scripts",
                "--workspace",
                `@moyarich/${name}`,
                "--pack-destination",
                directory,
                "--json",
              ],
              repo,
            ),
          ) as Array<{ filename: string }>;
          tarballs[`@moyarich/${name}`] = join(directory, packed[0].filename);
        }

        const installer = join(directory, "installer");
        await mkdir(installer);
        // npm installs the packed CLI runtime dependencies, including Commander.
        await run(
          "npm",
          [
            "install",
            "--prefix",
            installer,
            "--ignore-scripts",
            "--prefer-offline",
            "--no-audit",
            "--no-fund",
            tarballs["@moyarich/moyaforge-cli"],
          ],
          repo,
        );
        const cli = join(
          installer,
          "node_modules/@moyarich/moyaforge-cli/dist/bin/moyaforge.js",
        );
        assert.match(
          await run(process.execPath, [cli, "--help"], installer),
          /Usage: moyaforge/,
        );
        await use({ directory, cli, tarballs });
      } finally {
        if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
          await rm(directory, { recursive: true, force: true });
        else console.log(`Packed artifacts retained at ${directory}`);
      }
    },
    { scope: "worker", timeout: 12 * 60_000 },
  ],
});

export async function preparePackedConsumer(
  artifacts: PackedArtifacts,
  scenario: ConsumerScenario,
  index: ConsumerIndex,
): Promise<PreparedConsumer> {
  const root = join(artifacts.directory, `consumer-${index}`);
  let server: ChildProcess | undefined;
  try {
    await mkdir(root);
    if (scenario.template === "existing")
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          name: "host-app",
          version: "0.0.0",
          private: true,
          type: "module",
          scripts: { dev: "echo host-app" },
        }),
      );

    await run(
      process.execPath,
      [
        artifacts.cli,
        "init",
        "--cwd",
        root,
        "--registry",
        repo,
        "--mode",
        scenario.mode,
        "--template",
        scenario.template,
        "--no-install",
        ...(scenario.search ? ["--search"] : []),
      ],
      repo,
    );
    const manifest = JSON.parse(
      await readFile(join(root, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    for (const [name, file] of Object.entries(artifacts.tarballs)) {
      if (name === "@moyarich/moyaforge-cli")
        manifest.devDependencies[name] = `file:${file}`;
      else if (manifest.dependencies[name])
        manifest.dependencies[name] = `file:${file}`;
    }
    await writeFile(
      join(root, "package.json"),
      JSON.stringify(manifest, null, 2),
    );

    console.log(`Installing and building packed CLI consumer: ${index}`);
    await run(
      "npm",
      ["install", "--ignore-scripts", "--prefer-offline", "--no-audit", "--no-fund"],
      root,
    );
    await assert.rejects(access(join(root, "node_modules/monaco-editor")));
    await assert.rejects(access(join(root, "node_modules/@moyarich/console")));
    const packedCli = join(
      root,
      "node_modules/@moyarich/moyaforge-cli/dist/bin/moyaforge.js",
    );
    assert.match(
      await run(process.execPath, [packedCli, "--help"], root),
      /Usage: moyaforge/,
    );

    const prefix = scenario.template === "existing" ? "docs:" : "";
    await run("npm", ["run", `${prefix}typecheck`], root);
    await run("npm", ["run", `${prefix}build`], root);
    if (scenario.template === "existing")
      assert.equal(manifest.scripts.dev, "echo host-app");

    const port =
      4280 +
      [
        "source-docs",
        "package-docs-search",
        "existing-app",
        "hybrid-app",
      ].indexOf(index);
    server = spawn(
      "npm",
      [
        "run",
        `${prefix}dev`,
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      { cwd: root, stdio: "ignore", detached: true },
    );
    const url = `http://127.0.0.1:${port}`;
    await waitForServer(url);
    return { root, url, server, scenario };
  } catch (error) {
    stopServer(server);
    if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
      await rm(root, { recursive: true, force: true });
    throw error;
  }
}

export async function cleanupPackedConsumer(consumer?: PreparedConsumer) {
  if (!consumer) return;
  stopServer(consumer.server);
  if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
    await rm(consumer.root, { recursive: true, force: true });
  else console.log(`Consumer fixture retained at ${consumer.root}`);
}

/** Only user-visible browser behavior is run inside the one-minute test. */
export async function verifyPackedConsumer(
  page: Page,
  consumer: PreparedConsumer,
) {
  const { scenario, url } = consumer;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/#/docs`);
  await page.getByRole("heading", { name: "Welcome", exact: true }).waitFor();
  assert.ok(
    (await page.locator("pre.shiki span[style]").count()) > 0,
    "Shiki tokens render",
  );
  assert.ok((await page.locator("svg").count()) > 0, "Lucide icons render");
  await page.getByRole("tab", { name: "pnpm", exact: true }).click();
  const command = "pnpm add @moyarich/moyaforge";
  const panel = page.locator('[data-moyaforge-code-panel]:not([hidden])');
  assert.equal((await panel.locator("pre").textContent())?.trim(), command);
  await page.getByRole("button", { name: "Copy pnpm code", exact: true }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    command,
  );
  await page
    .locator(".mf-sidebar")
    .getByRole("link", { name: "Guide", exact: true })
    .click();
  await page.getByRole("heading", { name: "Guide", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Guide", exact: true }).waitFor();
  if (scenario.search) {
    await page.getByLabel("Search documentation").fill("Welcome");
    await page.locator(".mf-results a").first().waitFor();
    await page.locator(".mf-results a").first().click();
    await page.getByRole("heading", { name: "Welcome", exact: true }).waitFor();
  }
  await page.locator("html").evaluate((element) =>
    element.style.setProperty("--mf-accent", "rgb(10, 20, 30)"),
  );
  assert.equal(
    await page
      .locator(".mf-guide-link")
      .evaluate((element) => getComputedStyle(element).color),
    "rgb(10, 20, 30)",
  );
  if (scenario.template === "hybrid") {
    await page.getByRole("link", { name: "Interactive playground" }).click();
    await page.getByRole("button", { name: "Count: 0" }).click();
    await page.getByRole("button", { name: "Count: 1" }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log(
    `Passed packed CLI consumer: ${scenario.mode}/${scenario.template}${scenario.search ? " + SQLite search" : ""}`,
  );
}
