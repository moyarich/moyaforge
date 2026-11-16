import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, test } from "vitest";

const temporary: string[] = [];
const cli = resolve(import.meta.dirname, "../../scripts/build-registry/build-registry-cli.ts");

afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

test("one registry.config.ts drives shell, npm/bin CLI, and check mode", async () => {
  const root = await mkdtemp(join(tmpdir(), "registry-config-cli-"));
  temporary.push(root);
  const component = join(root, "packages/example/src/components/Widget");
  await mkdir(component, { recursive: true });
  await writeFile(
    join(root, "packages/example/package.json"),
    JSON.stringify({ name: "@example/widgets", peerDependencies: { react: ">=18" } }),
  );
  await writeFile(join(component, "index.ts"), 'export * from "./Widget.js";\n');
  await writeFile(join(component, "Widget.tsx"), 'import { createElement } from "react";\nexport const Widget = () => createElement("div");\n');
  await writeFile(
    join(root, "registry.config.ts"),
    `export default {
      name: "example",
      homepage: "https://example.org",
      packages: [{
        packagePath: "packages/example",
        nameOverrides: { Widget: "custom-widget" }
      }],
      dependencyManifests: [],
      templatesDir: false,
      docsDir: false,
      targetDir: "~/src/components/ui",
      outputFile: "artifacts/custom-registry.json",
      legacyStylesDir: false
    };\n`,
  );

  const run = (...args: string[]) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: root,
      encoding: "utf8",
    });

  const output = run("--print-output");
  expect(output.status, output.stderr).toBe(0);
  expect(output.stdout.trim()).toBe("artifacts/custom-registry.json");

  const build = run();
  expect(build.status, build.stderr).toBe(0);
  const file = join(root, "artifacts/custom-registry.json");
  const registry = JSON.parse(await readFile(file, "utf8"));
  expect(registry.name).toBe("example");
  expect(registry.homepage).toBe("https://example.org");
  expect(registry.items.map((item: { name: string }) => item.name)).toEqual([
    "custom-widget",
  ]);
  expect(registry.items[0].dependencies).toEqual(["react@>=18"]);

  const check = run("--check");
  expect(check.status, check.stderr).toBe(0);

  // Selecting a configured package does not lose its name overrides.
  const selected = run("--package", "packages/example", "--check");
  expect(selected.status, selected.stderr).toBe(0);

  await writeFile(join(component, "Widget.tsx"), 'export const Widget = "updated";\n');
  const stale = run("--check");
  expect(stale.status).not.toBe(0);
  expect(stale.stderr).toContain("Registry is stale");
});

test("workspace npm and installed bin both point to the config-aware CLI", async () => {
  const workspaceRoot = resolve(import.meta.dirname, "../..");
  const manifest = JSON.parse(
    await readFile(join(workspaceRoot, "package.json"), "utf8"),
  );
  const workflow = await readFile(
    join(workspaceRoot, ".github/workflows/build-component-registry.yml"),
    "utf8",
  );
  expect(manifest.scripts["registry:build"]).toContain("build-registry-cli.ts");
  expect(manifest.scripts["registry:check"]).toContain("--check");
  expect(manifest.bin["build-registry"]).toBe(
    "./scripts/build-registry/build-registry-cli.ts",
  );
  expect(workflow).toContain("--config registry.config.ts");
  expect(workflow).toContain("--print-output");
  expect(workflow).toContain("packages/moyaforge-monaco/src/**");
});
