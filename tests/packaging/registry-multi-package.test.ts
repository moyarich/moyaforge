import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { buildRegistry } from "../../scripts/build-registry/build-registry.ts";

const temporary: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function packageSource(root: string, name: string, componentDir: string, version: string) {
  const packageRoot = join(root, "packages", name);
  const widget = join(packageRoot, componentDir, "Sample");
  await mkdir(widget, { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({ name, peerDependencies: { react: version } }),
  );
  await writeFile(join(widget, "index.ts"), 'export * from "./Sample.js";\n');
  await writeFile(join(widget, "Sample.tsx"), 'import React from "react";\nexport const Sample = () => null;\n');
}

test("registry generation accepts component directories and names from multiple packages", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-registry-packages-"));
  temporary.push(root);
  await packageSource(root, "first", "src/components", "^18.0.0");
  await packageSource(root, "second", "src/widgets", "^19.0.0");
  // Name collision is resolved by a public name override, not a hardcoded package rule.
  const result = await buildRegistry(root, {
    packages: [
      { packagePath: "packages/first", nameOverrides: { Sample: "first-sample" } },
      {
        packagePath: "packages/second",
        componentsPath: "src/widgets",
        nameOverrides: { Sample: "second-sample" },
      },
    ],
  });

  expect(result.items.map((item) => item.name)).toEqual([
    "first-sample",
    "second-sample",
  ]);
  expect(result.items[0].dependencies).toContain("react@^18.0.0");
  expect(result.items[1].dependencies).toContain("react@^19.0.0");
  expect(result.items[0].files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "packages/first/src/components/Sample/Sample.tsx",
        target: "~/src/components/ui/Sample/Sample.tsx",
      }),
    ]),
  );
  expect(result.items[1].files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "packages/second/src/widgets/Sample/Sample.tsx",
        target: "~/src/components/ui/Sample/Sample.tsx",
      }),
    ]),
  );
  expect(JSON.parse(await readFile(join(root, "registry.json"), "utf8"))).toEqual(
    expect.objectContaining({ items: result.items }),
  );
  await expect(
    buildRegistry(root, {
      check: true,
      packages: [
        { packagePath: "packages/first", nameOverrides: { Sample: "first-sample" } },
        { packagePath: "packages/second", componentsPath: "src/widgets", nameOverrides: { Sample: "second-sample" } },
      ],
    }),
  ).resolves.toBeDefined();
});

test("duplicate public names across packages fail before overwriting registry entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-registry-collision-"));
  temporary.push(root);
  await packageSource(root, "one", "src/components", "^18.0.0");
  await packageSource(root, "two", "src/components", "^19.0.0");

  await expect(
    buildRegistry(root, {
      packages: [
        { packagePath: "packages/one" },
        { packagePath: "packages/two" },
      ],
    }),
  ).rejects.toThrow(/Duplicate registry name/);
});
