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
import { planComponentInstallation, resolveItems } from "../../src/registry.ts";

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
  const searchPanel = await read(packageRoot, "src/SearchPanel.tsx");
  expect(app).toContain('path="/playground"');
  expect(searchPanel).toContain('import { DocumentationSearch } from "./components/ui/Search/index.js"');
  expect(await read(packageRoot, "src/components/ui/Search/Search.tsx")).toContain("data-moyaforge-search");
  expect(searchPanel).toContain("resolveSearchPages(await searchPages(query))");
  const routing = await read(packageRoot, "src/Routing.tsx");
  expect(routing).toContain('from "@moyarich/moyaforge/registry-routes"');
  expect(routing).toContain("a: DocumentationLink");
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
    planComponentInstallation({ root, names: ["code-block"], registry: repository }),
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
    planComponentInstallation({ root: outside, names: ["bad"], registry: malicious }),
  ).rejects.toThrow(/Invalid component target/);
});

test("registry targets install directly under the configured component directory", async () => {
  const root = await project();
  const plan = await planComponentInstallation({
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
  const plan = await planComponentInstallation({
    root,
    names: ["docs-layout"],
    registry: repository,
  });
  expect(
    plan.files.some((file) => file.path.includes("src/components/utils/")),
  ).toBe(true);
  const custom = await planComponentInstallation({
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

test("init without a template configures only; init --template scaffolds the app", async () => {
  const root = await project();
  expect(run(root, "init", "--no-install").status).toBe(0);
  expect(JSON.parse(await read(root, "moyaforge.components.json")).directory).toBe("src/components/ui");
  await expect(read(root, "src/App.tsx")).rejects.toThrow();
  expect(run(root, "init", "--template", "docs", "--no-install").status).toBe(0);
  expect(await read(root, "src/App.tsx")).toContain("<HashRouter>");
});

test("commander exposes subcommand help and validates template choices", async () => {
  const root = await project();
  const help = run(root, "init", "--help");
  expect(help.status).toBe(0);
  expect(help.stdout).toContain("--template");
  expect(help.stdout).toContain("--dry-run");
  const invalid = run(root, "init", "--template", "invalid", "--no-install");
  expect(invalid.status).not.toBe(0);
  expect(invalid.stderr).toMatch(/allowed choices/i);
});

test("Commander root assembles fresh, independently defined commands", async () => {
  const { createRootCliCommand } = await import("../../src/bin/cli.ts");
  const one = createRootCliCommand();
  const two = createRootCliCommand();
  expect(one).not.toBe(two);
  expect(one.commands.map(command => command.name())).toEqual([
    "init", "add", "list", "dev", "preview",
  ]);
  expect(one.commands[1]).not.toBe(two.commands[1]);
});

test("init --template uses the packaged manifest and enables only selected features", async () => {
  const base = JSON.parse(await readFile(resolve(repository, "packages/moyaforge-cli/templates/base/package.json"), "utf8"));
  const root = await project();
  expect(run(root, "init", "--template", "docs", "--no-install").status).toBe(0);
  const standard = JSON.parse(await read(root, "package.json"));
  expect(standard.scripts).toEqual(base.scripts);
  expect(standard.dependencies).toEqual(base.dependencies);
  expect(standard.devDependencies).toEqual(base.devDependencies);
  expect(standard.dependencies).not.toHaveProperty("@moyarich/moyaforge-search-sqlite");

  const custom = await project();
  await writeFile(join(custom, "package.json"), JSON.stringify({
    name: "consumer-app", version: "1.2.3", scripts: { dev: "custom-server" },
    dependencies: { react: "^18.3.1" },
  }));
  expect(run(custom, "init", "--template", "hybrid", "--mode", "package",
    "--search", "--no-install").status).toBe(0);
  const manifest = JSON.parse(await read(custom, "package.json"));
  expect(manifest.name).toBe("consumer-app");
  expect(manifest.scripts.dev).toBe("custom-server");
  expect(manifest.dependencies.react).toBe("^18.3.1");
  expect(manifest.dependencies["react-dom"]).toBe("^18.3.1");
  expect(manifest.dependencies["@moyarich/moyaforge"]).toBe("^0.1.0");
  expect(manifest.dependencies["@moyarich/moyaforge-search-sqlite"]).toBe("^0.1.0");
});

test("playground init uses consumer-owned content and registry-installed components", async () => {
  const root = await project();
  const result = run(root, "init", "--template", "playground", "--search", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  const registry = await read(root, "registry.config.ts");
  expect(registry).toContain('base: "docs"');
  expect(registry).not.toContain("../../packages");
  const vite = await read(root, "vite.config.ts");
  expect(vite).toContain("createContentDiscovery");
  expect(vite).toContain("remarkSourceLinks");
  expect(vite).toContain("sqliteSearchPlugin");
  const app = await read(root, "src/App.tsx");
  expect(app).toContain("RegistryRoutes");
  expect(app).toContain("PlaygroundShell");
  expect(app).not.toContain("apps/playground");
  expect(await read(root, "src/components/ui/Layout/DocumentationSite/DocumentationSite.tsx")).toContain("DocumentationSite");
  expect(await read(root, "src/components/ui/SidebarV1/SidebarV1.tsx")).toContain("SidebarV1");
  expect(await read(root, "src/components/ui/CustomBlock/CustomBlock.tsx")).toContain("CustomBlock");
  const adapter = await read(root, "src/SearchAdapter.tsx");
  expect(adapter).toContain("searchPages");
  const manifest = JSON.parse(await read(root, "package.json"));
  expect(manifest.dependencies).toHaveProperty("@moyarich/moyaforge");
  expect(manifest.dependencies).toHaveProperty("@moyarich/moyaforge-search-sqlite");
  expect(manifest.devDependencies).toHaveProperty("shiki");
  const plain = await project();
  expect(run(plain, "init", "--template", "playground", "--no-install").status).toBe(0);
  expect(await read(plain, "src/SearchAdapter.tsx")).not.toContain("searchPages");
  expect(await read(plain, "vite.config.ts")).not.toContain("sqliteSearchPlugin");
});
