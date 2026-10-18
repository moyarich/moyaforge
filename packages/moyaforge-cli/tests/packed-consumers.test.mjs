import { test } from "vitest";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  access,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const repo = resolve(import.meta.dirname, "../../..");
test.skipIf(process.env.MOYAFORGE_MAIN_ONLY_BROWSER === "true")("packed CLI consumers", async () => {
  const temp = await mkdtemp(join(tmpdir(), "moyaforge-packed-consumers-"));
  async function run(cmd, args, cwd) {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    const [code] = await once(child, "exit");
    if (code !== 0)
      throw Error(
        `${cmd} ${args.join(" ")} failed (${code}) in ${cwd}\n${output}`,
      );
    return output;
  }
  const tarballs = {};
  let browser;
  try {
    for (const name of [
      "moyaforge-mdx",
      "moyaforge",
      "moyaforge-search-sqlite",
      "moyaforge-cli",
    ]) {
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
            temp,
            "--json",
          ],
          repo,
        ),
      );
      tarballs[`@moyarich/${name}`] = join(
        temp,
        (Array.isArray(packed) ? packed[0] : Object.values(packed)[0]).filename,
      );
    }
    const unpack = join(temp, "installer");
    await mkdir(unpack);
    await run(
      "tar",
      ["-xzf", tarballs["@moyarich/moyaforge-cli"], "-C", unpack],
      repo,
    );
    const cli = join(unpack, "package/src/cli.js");
    browser = await chromium.launch();
    for (const [index, fixture] of [
      { mode: "source", template: "docs", search: false },
      { mode: "package", template: "docs", search: true },
      { mode: "source", template: "existing", search: false },
      { mode: "source", template: "hybrid", search: false },
    ].entries()) {
      const root = join(temp, `consumer-${index}`);
      await mkdir(root);
      if (fixture.template === "existing")
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
          cli,
          "init",
          "--cwd",
          root,
          "--registry",
          repo,
          "--mode",
          fixture.mode,
          "--template",
          fixture.template,
          "--no-install",
          ...(fixture.search ? ["--search"] : []),
        ],
        repo,
      );
      const manifest = JSON.parse(
        await readFile(join(root, "package.json"), "utf8"),
      );
      for (const [name, file] of Object.entries(tarballs)) {
        if (name === "@moyarich/moyaforge-cli")
          manifest.devDependencies[name] = `file:${file}`;
        else if (manifest.dependencies[name])
          manifest.dependencies[name] = `file:${file}`;
      }
      await writeFile(
        join(root, "package.json"),
        JSON.stringify(manifest, null, 2),
      );
      await run(
        "npm",
        ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
        root,
      );
      await assert.rejects(access(join(root, "node_modules/monaco-editor")));
      await assert.rejects(
        access(join(root, "node_modules/@moyarich/console")),
      );
      const packedCLI = join(
        root,
        "node_modules/@moyarich/moyaforge-cli/src/cli.js",
      );
      assert.match(
        await run(process.execPath, [packedCLI, "--help"], root),
        /Usage: moyaforge/,
      );
      const prefix = fixture.template === "existing" ? "docs:" : "";
      await run("npm", ["run", `${prefix}typecheck`], root);
      await run(process.execPath, [packedCLI, "build"], root);
      if (fixture.template === "existing")
        assert.equal(manifest.scripts.dev, "echo host-app");
      const port = 4280 + index;
      const server = spawn(
        process.execPath,
        [
          packedCLI,
          "dev",
          "--host",
          "127.0.0.1",
          "--port",
          String(port),
          "--strictPort",
        ],
        { cwd: root, stdio: "ignore", detached: true },
      );
      const url = `http://127.0.0.1:${port}`;
      try {
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              ready = true;
              break;
            }
          } catch {}
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        assert.ok(ready, "consumer dev server starts");
        const page = await browser.newPage({
          permissions: ["clipboard-read", "clipboard-write"],
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${url}/#/docs`);
        await page
          .getByRole("heading", { name: "Welcome", exact: true })
          .waitFor();
        assert.ok(
          (await page.locator("pre.shiki span[style]").count()) > 0,
          "Shiki tokens render",
        );
        assert.ok(
          (await page.locator("svg").count()) > 0,
          "Lucide icons render",
        );
        await page.getByRole("tab", { name: "pnpm", exact: true }).click();
        await page
          .getByRole("button", { name: "Copy pnpm code", exact: true })
          .click();
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          "pnpm add example",
        );
        await page
          .locator(".mf-sidebar")
          .getByRole("link", { name: "Guide", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Guide", exact: true })
          .waitFor();
        await page.reload();
        await page
          .getByRole("heading", { name: "Guide", exact: true })
          .waitFor();
        if (fixture.search) {
          await page.getByLabel("Search documentation").fill("Welcome");
          await page.locator(".mf-results a").first().waitFor();
          await page.locator(".mf-results a").first().click();
          await page
            .getByRole("heading", { name: "Welcome", exact: true })
            .waitFor();
        }
        await page
          .locator("html")
          .evaluate((element) =>
            element.style.setProperty("--mf-accent", "rgb(10, 20, 30)"),
          );
        assert.equal(
          await page
            .locator(".mf-guide-link")
            .evaluate((element) => getComputedStyle(element).color),
          "rgb(10, 20, 30)",
        );
        if (fixture.template === "hybrid") {
          await page
            .getByRole("link", { name: "Interactive playground" })
            .click();
          await page.getByRole("button", { name: "Count: 0" }).click();
          await page.getByRole("button", { name: "Count: 1" }).waitFor();
        }
        assert.deepEqual(errors, []);
        await page.close();
      } finally {
        try {
          process.kill(-server.pid, "SIGTERM");
        } catch {}
      }
      console.log(
        `Passed packed CLI consumer: ${fixture.mode}/${fixture.template}${fixture.search ? " + SQLite search" : ""}`,
      );
    }
  } finally {
    await browser?.close();
    if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
      await rm(temp, { recursive: true, force: true });
    else console.log(`Consumer fixtures retained at ${temp}`);
  }
}, 300000);
