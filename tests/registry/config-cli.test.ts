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

test("explicit CLI flags override configuration without mutating its defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "registry-flags-cli-"));
  temporary.push(root);
  const widget = join(root, "packages/widgets/src/components/Widget");
  await mkdir(widget, { recursive: true });
  await mkdir(join(root, "shared"), { recursive: true });
  await mkdir(join(root, "examples/templates"), { recursive: true });
  await mkdir(join(root, "examples/docs"), { recursive: true });

  await writeFile(
    join(root, "packages/widgets/package.json"),
    JSON.stringify({ peerDependencies: { react: ">=18" } }),
  );
  await writeFile(join(widget, "index.ts"), 'export * from "./Widget.js";\n');
  await writeFile(
    join(widget, "Widget.tsx"),
    'import "shared-lib";\nimport React from "react";\nexport const Widget = () => null;\n',
  );
  await writeFile(
    join(root, "shared/default.json"),
    JSON.stringify({ dependencies: { "shared-lib": "^1.0.0" } }),
  );
  await writeFile(
    join(root, "shared/override.json"),
    JSON.stringify({ dependencies: { "shared-lib": "^2.0.0" } }),
  );
  await writeFile(
    join(root, "examples/templates/demo.tsx"),
    "export const Demo = true;\n",
  );
  await writeFile(
    join(root, "examples/docs/widget-custom.md"),
    "Custom widget documentation\n",
  );
  await writeFile(
    join(root, "registry.config.ts"),
    `export default {
      name: "default-name",
      homepage: "https://default.example",
      packages: [{
        packagePath: "packages/widgets",
        nameOverrides: { Widget: "widget-custom" }
      }],
      dependencyManifests: ["shared/default.json"],
      templatesDir: false,
      docsDir: false,
      outputFile: "registry.json",
      targetDir: "~/src/components/ui",
      legacyStylesDir: false
    };\n`,
  );

  const run = (...args: string[]) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: root,
      encoding: "utf8",
    });

  const args = [
    "--name", "other-name",
    "--homepage", "https://overridden.example",
    "--package", "packages/widgets",
    "--dependency-manifest", "shared/override.json",
    "--templates-dir", "examples/templates",
    "--docs-dir", "examples/docs",
    "--output-file", "generated/overridden.json",
    "--target-dir", "~/custom/ui",
    "--legacy-styles-dir", "legacy/styles",
  ];

  const output = run("--print-output", ...args);
  expect(output.status, output.stderr).toBe(0);
  expect(output.stdout.trim()).toBe("generated/overridden.json");

  const built = run(...args);
  expect(built.status, built.stderr).toBe(0);

  const result = JSON.parse(
    await readFile(join(root, "generated/overridden.json"), "utf8"),
  );
  expect(result.name).toBe("other-name");
  expect(result.homepage).toBe("https://overridden.example");
  expect(result.items.map((item: { name: string }) => item.name)).toEqual([
    "demo",
    "widget-custom",
  ]);

  const component = result.items.find(
    (item: { name: string }) => item.name === "widget-custom",
  );
  expect(component.dependencies).toContain("shared-lib@^2.0.0");
  expect(component.dependencies).not.toContain("shared-lib@^1.0.0");
  expect(component.docs).toBe("Custom widget documentation\n");
  expect(component.files[0].target).toMatch(/^~\/custom\/ui\//);

  const check = run(...args, "--check");
  expect(check.status, check.stderr).toBe(0);

  const withoutExtras = [
    "--dependency-manifest", "shared/override.json",
    "--no-templates",
    "--no-docs",
    "--no-legacy-styles",
    "--output-file", "generated/minimal.json",
  ];
  const minimum = run(...withoutExtras);
  expect(minimum.status, minimum.stderr).toBe(0);
  const minimalRegistry = JSON.parse(
    await readFile(join(root, "generated/minimal.json"), "utf8"),
  );
  expect(minimalRegistry.name).toBe("default-name");
  expect(minimalRegistry.items.map((item: { name: string }) => item.name)).toEqual([
    "widget-custom",
  ]);
  expect(minimalRegistry.items[0]).not.toHaveProperty("docs");
  expect(minimalRegistry.items[0].dependencies).toContain("shared-lib@^2.0.0");

  // CLI overrides must never mutate the configuration used by a normal run.
  const normal = run();
  expect(normal.status, normal.stderr).toBe(0);
  const defaults = JSON.parse(await readFile(join(root, "registry.json"), "utf8"));
  expect(defaults.name).toBe("default-name");
  expect(defaults.homepage).toBe("https://default.example");
  expect(defaults.items[0].dependencies).toContain("shared-lib@^1.0.0");
});
