import { afterEach, expect, test } from "vitest";
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { planItems, resolveItems } from "../../src/registry.ts";

const repository = resolve(import.meta.dirname, "../../../..");
const cli = resolve(import.meta.dirname, "../../dist/bin/moyaforge.js");
const temporary = [];
afterEach(async () => {
  for (const path of temporary.splice(0))
    await rm(path, { recursive: true, force: true });
});
async function project() {
  const path = await mkdtemp(join(tmpdir(), "moyaforge-cli-test-"));
  temporary.push(path);
  return path;
}
function run(root, ...args) {
  return spawnSync(
    process.execPath,
    [cli, ...args, "--cwd", root, "--registry", repository],
    { encoding: "utf8" },
  );
}
const read = (root, path) => readFile(join(root, path), "utf8");

test("dry-run plans registry dependencies without writing files", async () => {
  const root = await project();
  const result = run(root, "add", "code-group", "--dry-run");
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("CodeBlock/CodeBlock.tsx");
  expect(result.stdout).not.toContain("Monaco");
  await expect(
    read(root, "src/components/ui/CodeGroup/CodeGroup.css"),
  ).rejects.toThrow();
});
test("source installation is canonical, preserves edits, shows diffs, and explicitly overwrites", async () => {
  const root = await project();
  expect(run(root, "add", "code-group", "--no-install").status).toBe(0);
  const path = "src/components/ui/CodeGroup/CodeGroup.tsx";
  const original = await read(root, path);
  expect(original).toBe(
    await read(
      repository,
      "packages/moyaforge-ui/src/components/CodeGroup/CodeGroup.tsx",
    ),
  );
  await writeFile(join(root, path), "// locally customized\n");
  const diff = run(root, "add", "code-group", "--dry-run", "--diff");
  expect(diff.stdout).toContain("--- current/");
  expect(diff.stdout).toContain("// locally customized");
  expect(run(root, "add", "code-group", "--no-install").status).toBe(0);
  expect(await read(root, path)).toBe("// locally customized\n");
  expect(
    run(root, "add", "code-group", "--no-install", "--overwrite").status,
  ).toBe(0);
  expect(await read(root, path)).toBe(original);
});
test("custom destinations retain portable relative imports", async () => {
  const root = await project();
  expect(
    run(root, "add", "docs-shell", "--directory", "ui/docs", "--no-install")
      .status,
  ).toBe(0);
  expect(await read(root, "ui/docs/docs-shell.tsx")).toContain(
    "./Layout/DocsLayout/DocsLayout.js",
  );
  expect(
    await read(root, "ui/docs/Layout/DocsLayout/DocsLayout.tsx"),
  ).toContain('import "./DocsLayout.css";');
  await expect(read(root, "ui/docs/docs-shell.css")).rejects.toThrow();
});
test("init produces source/package/hybrid starters and preserves existing app configuration", async () => {
  const root = await project();
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "host",
      private: true,
      scripts: { dev: "my-host-server" },
      dependencies: { react: "^18.3.1" },
    }),
  );
  expect(
    run(root, "init", "--template", "existing", "--no-install").status,
  ).toBe(0);
  const manifest = JSON.parse(await read(root, "package.json"));
  expect(manifest.scripts.dev).toBe("my-host-server");
  expect(manifest.scripts["docs:dev"]).toContain("moyaforge/vite.config.ts");
  expect(manifest.dependencies.react).toBe("^18.3.1");
  expect(manifest.dependencies["react-dom"]).toBe("^18.3.1");
  expect(manifest.dependencies).not.toHaveProperty("@moyarich/moyaforge");
  const existingApp = await read(root, "moyaforge/src/App.tsx");
  expect(existingApp).toContain("../../src/components/ui/docs-shell.js");
  expect(existingApp).toContain("sidebar={sidebar}");
  expect(existingApp).not.toContain("components/Routing/content-routing.js");
  expect(await read(root, "moyaforge/vite.config.ts")).toContain(
    "@moyarich/moyaforge-mdx/vite",
  );
  expect(await read(root, "moyaforge/src/main.tsx")).not.toContain(
    "code-group.css",
  );
  expect(
    await read(root, "src/components/ui/CodeGroup/CodeGroup.tsx"),
  ).toContain('import "./CodeGroup.css";');
  expect(
    await read(root, "src/components/ui/CodeGroup/CodeGroup.tsx"),
  ).toContain("CodeGroup");
  const packageRoot = await project();
  expect(
    run(
      packageRoot,
      "init",
      "--mode",
      "package",
      "--template",
      "hybrid",
      "--search",
      "--no-install",
    ).status,
  ).toBe(0);
  const app = await read(packageRoot, "src/App.tsx");
  expect(app).toContain('path="/playground"');
  expect(app).toContain("searchPages(event.currentTarget.value)");
  expect(app).toContain("<SearchPanel />");
  expect(app).toContain("<HashRouter>");
  expect(app).toContain("pages={pages}");
  expect(app).toContain("sidebar={sidebar}");
  expect(app).not.toContain("MoyaForgeRouter");
  expect(app).not.toContain("useContentRouting");
  expect(app).not.toContain("sources={registry.sources}");
  expect(app).not.toContain("__");
  expect(await read(packageRoot, "vite.config.ts")).toContain(
    "sqliteSearchPlugin",
  );
  expect(await read(packageRoot, "src/components/ui/docs-shell.tsx")).toContain(
    "DocsShell",
  );
  expect(await read(packageRoot, "package.json")).not.toMatch(
    /monaco|shadcn|tailwind|radix|console/,
  );
});
test("invalid items and dependency cycles fail before writes", async () => {
  const root = await project();
  expect(run(root, "add", "missing", "--no-install").status).toBe(1);
  expect(() =>
    resolveItems(
      {
        items: [
          { name: "a", registryDependencies: ["moyarich/moyaforge/b"] },
          { name: "b", registryDependencies: ["moyarich/moyaforge/a"] },
        ],
      },
      ["a"],
    ),
  ).toThrow(/cycle/);
});
test("registry targets cannot traverse directories or follow consumer symlinks", async () => {
  const root = await project();
  const outside = await project();
  await mkdir(join(root, "src"));
  await symlink(outside, join(root, "src/components"), "dir");
  await expect(
    planItems({ root, names: ["code-block"], registry: repository }),
  ).rejects.toThrow(/symlink/);
  const malicious = await project();
  await writeFile(
    join(malicious, "registry.json"),
    JSON.stringify({
      items: [
        {
          name: "bad",
          files: [
            {
              path: "file.ts",
              target: "~/src/components/ui/../../package.json",
              content: "bad",
            },
          ],
        },
      ],
    }),
  );
  await expect(
    planItems({ root: outside, names: ["bad"], registry: malicious }),
  ).rejects.toThrow(/Invalid component target/);
});

test("registry targets install directly under the configured component directory", async () => {
  const root = await project();
  const plan = await planItems({
    root,
    names: ["code-block"],
    registry: repository,
  });
  expect(
    plan.files.some(
      (file) =>
        file.path === join(root, "src/components/ui/CodeBlock/CodeBlock.tsx"),
    ),
  ).toBe(true);
  expect(
    plan.files.every((file) => !file.path.includes("/ui/components/")),
  ).toBe(true);

  await writeFile(
    join(root, "moyaforge.components.json"),
    JSON.stringify({ directory: "src/custom-components" }),
  );
  expect(run(root, "add", "code-block", "--no-install").status).toBe(0);
  expect(
    await read(root, "src/custom-components/CodeBlock/CodeBlock.tsx"),
  ).toContain("CodeBlock");
});

test("monaco installation reports setup notes without copying README files", async () => {
  const root = await project();
  const dry = run(root, "add", "monaco-editor-react", "--dry-run");
  expect(dry.status).toBe(0);
  expect(dry.stdout).toContain("monaco-editor@^0.52.2");
  expect(dry.stdout).toContain(
    "npm install @monaco-editor/react monaco-editor lucide-react",
  );
  expect(dry.stdout).toContain("Monaco workers");
  await expect(
    read(root, "src/components/ui/MonacoEditorReact/README.md"),
  ).rejects.toThrow();
  const installed = run(root, "add", "monaco-editor-react", "--no-install");
  expect(installed.status).toBe(0);
  expect(installed.stdout).toContain("Setup notes:");
  expect(installed.stdout).toContain("MonacoEditorReact setup");
  await expect(
    read(root, "src/components/ui/MonacoEditorReact/README.md"),
  ).rejects.toThrow();
});

test("shared registry utilities remain siblings of UI files, including custom destinations", async () => {
  const root = await project();
  const plan = await planItems({
    root,
    names: ["docs-layout"],
    registry: repository,
  });
  expect(
    plan.files.some((file) => file.path.includes("src/components/utils/")),
  ).toBe(true);
  const custom = await planItems({
    root,
    names: ["docs-layout"],
    registry: repository,
    directory: "src/custom-components/ui",
  });
  expect(
    custom.files.some((file) =>
      file.path.includes("src/custom-components/utils/"),
    ),
  ).toBe(true);
  expect(
    custom.files.some((file) =>
      file.path.includes("src/custom-components/ui/"),
    ),
  ).toBe(true);
});
