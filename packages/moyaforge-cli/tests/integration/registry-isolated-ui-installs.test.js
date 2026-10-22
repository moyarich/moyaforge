import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, relative } from "node:path";
import { planItems, applyPlan } from "../../src/registry.ts";

const repository = resolve(import.meta.dirname, "../../../..");
const roots = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

for (const name of [
  "code-preview",
  "docs-layout",
  "documentation-site",
  "monaco-editor-react",
  "monaco-editor-type-fox",
]) {
  test(`registry installs ${name} independently with canonical source and CSS`, async () => {
    const root = await mkdtemp(resolve(tmpdir(), "moyaforge-ui-install-"));
    roots.push(root);
    const plan = await planItems({ root, names: [name], registry: repository });
    expect(plan.items).toEqual([name]);
    expect(plan.files.length).toBeGreaterThan(0);
    const paths = plan.files.map((file) =>
      relative(root, file.path).replaceAll("\\\\", "/"),
    );
    expect(paths.some((path) => path.endsWith(".tsx"))).toBe(true);
    expect(paths.some((path) => path.endsWith(".css"))).toBe(true);
    expect(paths.every((path) => path.startsWith("src/components/ui/") || path.startsWith("src/components/utils/"))).toBe(true);
    expect(
      plan.files.every(
        (file) => !file.content.includes("packages/moyaforge/src/"),
      ),
    ).toBe(true);
    await applyPlan(plan, { root });
    for (const file of plan.files) {
      expect(await readFile(file.path, "utf8")).toBe(file.content);
    }
    const repeat = await planItems({
      root,
      names: [name],
      registry: repository,
    });
    expect(repeat.files.every((file) => file.previous === file.content)).toBe(
      true,
    );
  });
}

test("editor registry entries keep their engine dependencies separate", async () => {
  const registry = JSON.parse(
    await readFile(resolve(repository, "registry.json"), "utf8"),
  );
  const react = registry.items.find(
    (item) => item.name === "monaco-editor-react",
  );
  const typefox = registry.items.find(
    (item) => item.name === "monaco-editor-type-fox",
  );
  expect(
    react.dependencies.some((dependency) =>
      dependency.startsWith("@monaco-editor/react@"),
    ),
  ).toBe(true);
  expect(
    react.dependencies.some(
      (dependency) =>
        dependency.includes("typefox") ||
        dependency.includes("codingame") ||
        dependency.includes("monaco-languageclient"),
    ),
  ).toBe(false);
  expect(
    typefox.dependencies.some((dependency) =>
      dependency.startsWith("@typefox/monaco-editor-react@"),
    ),
  ).toBe(true);
  expect(
    typefox.dependencies.some(
      (dependency) =>
        dependency.startsWith("@monaco-editor/react@") ||
        dependency.startsWith("monaco-editor@"),
    ),
  ).toBe(false);
});
