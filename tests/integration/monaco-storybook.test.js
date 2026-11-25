import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const uiRoot = resolve(import.meta.dirname, "../../packages/moyaforge-ui");

test("Storybook initializes one shared Monaco runtime before rendering either editor", async () => {
  const story = await readFile(resolve(uiRoot, "stories/MonacoEditors.stories.tsx"), "utf8");
  const config = await readFile(resolve(uiRoot, ".storybook/main.ts"), "utf8");
  const manifest = JSON.parse(await readFile(resolve(uiRoot, "package.json"), "utf8"));

  expect(story).toContain('from "@moyarich/moyaforge-monaco/runtime/initializeSharedMonaco"');
  expect(story).toMatch(/loaders:\s*\[\s*async \(\) => \{\s*await initializeSharedMonaco\(\)/);
  expect(story).toContain("export const ReactMonaco");
  expect(story).toContain("export const TypeFoxMonaco");
  expect(story).toContain("export const SideBySide");
  expect(story).not.toMatch(/moyaforge-monaco\/(react|typefox)\/auto/);

  expect(config).toContain("monacoReactTypesPlugin(workspaceRoot)");
  expect(manifest.scripts.storybook).toContain("build --workspace @moyarich/moyaforge-monaco");
  expect(manifest.scripts["test:storybook"]).toContain("build --workspace @moyarich/moyaforge-monaco");
});
