import { test } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const repo = resolve(import.meta.dirname, "../../..");
test.skipIf(process.env.MOYAFORGE_MAIN_ONLY_BROWSER === "true")("GitHub shadcn consumer", async () => {
  async function run(command, args, cwd) {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let text = "";
    child.stdout.on("data", (chunk) => (text += chunk));
    child.stderr.on("data", (chunk) => (text += chunk));
    const [status] = await once(child, "exit");
    if (status !== 0)
      throw Error(`${command} ${args.join(" ")} failed\n${text}`);
    return text.trim();
  }
  const ref =
    process.env.MOYAFORGE_REGISTRY_REF ??
    (await run("git", ["rev-parse", "HEAD"], repo));
  const root = await mkdtemp(join(tmpdir(), "moyaforge-shadcn-consumer-"));
  let browser;
  let server;
  try {
    await mkdir(join(root, "src"));
    await writeFile(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "registry-consumer",
          version: "0.0.0",
          private: true,
          type: "module",
          scripts: {
            build: "vite build",
            dev: "vite --host 127.0.0.1 --port 4390 --strictPort",
          },
          dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
          devDependencies: {
            vite: "^8.3.4",
            "@vitejs/plugin-react": "^6.1.2",
            typescript: "^7.0.2",
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(root, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "new-york",
          rsc: false,
          tsx: true,
          tailwind: {
            config: "",
            css: "src/styles.css",
            baseColor: "slate",
            cssVariables: true,
          },
          aliases: {
            components: "@/components",
            utils: "@/lib/utils",
            ui: "@/components/ui",
            lib: "@/lib",
            hooks: "@/hooks",
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(root, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM"],
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            types: ["vite/client"],
            paths: { "@/*": ["./src/*"] },
          },
          include: ["src"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(root, "vite.config.ts"),
      'import {defineConfig} from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({plugins:[react()]});',
    );
    await writeFile(
      join(root, "index.html"),
      '<html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
    );
    await writeFile(
      join(root, "src/styles.css"),
      "body {font-family:system-ui;}",
    );
    await run(
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
      root,
    );
    const installed = await run(
      "npm",
      [
        "exec",
        "--yes",
        "--package",
        "shadcn@4.21.5",
        "--",
        "shadcn",
        "add",
        `moyarich/moyaforge/code-block#${ref}`,
        "--yes",
        "--cwd",
        root,
      ],
      repo,
    );
    console.log(installed);
    await writeFile(
      join(root, "src/main.tsx"),
      'import {createRoot} from "react-dom/client"; import {CodeBlock} from "./components/moyaforge/components/CodeBlock/CodeBlock"; createRoot(document.getElementById("root")!).render(<CodeBlock language="tsx"><code>const message = "Hello";</code></CodeBlock>);',
    );
    const code = await readFile(
      join(root, "src/components/moyaforge/components/CodeBlock/CodeBlock.tsx"),
      "utf8",
    );
    assert.ok(code.includes("CodeCopyIcon"));
    assert.ok(
      code.includes('import "./CodeBlock.css"'),
      "component owns its CSS import",
    );
    await run("npm", ["exec", "--", "tsc", "--noEmit"], root);
    await run("npm", ["run", "build"], root);
    server = spawn("npm", ["run", "dev"], {
      cwd: root,
      stdio: "ignore",
      detached: true,
    });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:4390")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready);
    browser = await chromium.launch();
    const page = await browser.newPage({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4390");
    await page.locator("[data-moyaforge-code-block]").waitFor();
    await page.locator("[data-moyaforge-code-block]").hover();
    await page.getByRole("button", { name: "Copy code", exact: true }).click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      'const message = "Hello";',
    );
    assert.deepEqual(errors, []);
    console.log(
      `Passed public GitHub shadcn install and browser copy check at ${ref}`,
    );
  } finally {
    await browser?.close();
    if (server)
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {}
    if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
      await rm(root, { recursive: true, force: true });
    else console.log(`Shadcn fixture retained at ${root}`);
  }
}, 300000);
