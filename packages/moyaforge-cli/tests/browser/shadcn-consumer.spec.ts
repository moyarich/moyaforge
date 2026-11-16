import { test } from "@playwright/test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import assert from "node:assert/strict";
import { run, stopServer, waitForServer } from "./packed-consumer-helper.js";

const repo = resolve(import.meta.dirname, "../../../..");

interface ShadcnConsumer {
  root: string;
  url: string;
  registryItem: string;
  server?: ChildProcess;
  registryServer?: Server;
}

let consumer: ShadcnConsumer;

/** npm installation, shadcn scaffolding, typecheck and build are setup, not browser assertions. */
async function prepareShadcnConsumer(): Promise<ShadcnConsumer> {
  const ref =
    process.env.MOYAFORGE_REGISTRY_REF ??
    (await run("git", ["rev-parse", "HEAD"], repo)).trim();
  const root = await mkdtemp(join(tmpdir(), "moyaforge-shadcn-consumer-"));
  let registryServer: Server | undefined;
  let server: ChildProcess | undefined;
  let registryItem = `moyarich/moyaforge/code-block#${ref}`;

  try {
    if (process.env.MOYAFORGE_REGISTRY_SOURCE === "local") {
      const registry = JSON.parse(
        await readFile(join(repo, "registry.json"), "utf8"),
      ) as {
        items: Array<{
          name: string;
          files: Array<{ path: string }>;
        }>;
      };
      const item = registry.items.find((item) => item.name === "code-block");
      assert.ok(item, "local registry contains code-block");
      const payload = JSON.stringify({
        ...item,
        files: await Promise.all(
          item.files.map(async (file) => ({
            ...file,
            content: await readFile(join(repo, file.path), "utf8"),
          })),
        ),
      });
      registryServer = createServer((request, response) => {
        if (request.url !== "/code-block.json") {
          response.writeHead(404);
          response.end();
          return;
        }
        response.writeHead(200, { "content-type": "application/json" });
        response.end(payload);
      });
      await new Promise<void>((done) =>
        registryServer!.listen(0, "127.0.0.1", done),
      );
      const address = registryServer.address();
      assert.ok(address && typeof address !== "string");
      registryItem = `http://127.0.0.1:${address.port}/code-block.json`;
    }
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
            paths: { "@/*": [".././src/*"] },
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
      ["install", "--ignore-scripts", "--prefer-offline", "--no-audit", "--no-fund"],
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
        registryItem,
        "--yes",
        "--cwd",
        root,
      ],
      repo,
    );
    console.log(installed);
    await writeFile(
      join(root, "src/main.tsx"),
      'import {createRoot} from "react-dom/client"; import {CodeBlock} from "./components/ui/CodeBlock/CodeBlock"; createRoot(document.getElementById("root")!).render(<CodeBlock language="tsx"><code>const message = "Hello";</code></CodeBlock>);',
    );
    const code = await readFile(
      join(root, "src/components/ui/CodeBlock/CodeBlock.tsx"),
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
    const url = "http://127.0.0.1:4390";
    await waitForServer(url);
    return { root, url, registryItem, server, registryServer };
  } catch (error) {
    stopServer(server);
    if (registryServer)
      await new Promise<void>((done) => registryServer!.close(() => done()));
    if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
      await rm(root, { recursive: true, force: true });
    throw error;
  }
}

test.beforeAll(async () => {
  // Expensive npm and shadcn setup has its own timeout; the browser test remains 60s.
  test.setTimeout(12 * 60_000);
  consumer = await prepareShadcnConsumer();
});

test.afterAll(async () => {
  if (!consumer) return;
  stopServer(consumer.server);
  if (consumer.registryServer)
    await new Promise<void>((done) => consumer.registryServer!.close(() => done()));
  if (!process.env.MOYAFORGE_KEEP_CONSUMERS)
    await rm(consumer.root, { recursive: true, force: true });
  else console.log(`Shadcn fixture retained at ${consumer.root}`);
});

test("GitHub shadcn consumer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(consumer.url);
  await page.locator("[data-moyaforge-code-block]").waitFor();
  assert.equal(
    await page
      .locator("[data-moyaforge-code-block] pre")
      .evaluate((element) => getComputedStyle(element).paddingTop),
    "24px",
    "component CSS loads without an aggregate stylesheet",
  );
  await page.locator("[data-moyaforge-code-block]").hover();
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    'const message = "Hello";',
  );
  assert.deepEqual(errors, []);
  console.log(
    `Passed shadcn install, colocated CSS and clipboard check: ${consumer.registryItem}`,
  );
});
