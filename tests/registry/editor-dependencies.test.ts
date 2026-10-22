import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const repository = resolve(import.meta.dirname, "../..");

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
