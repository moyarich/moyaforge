import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const monacoRoot = resolve(import.meta.dirname, "../../packages/moyaforge-monaco");

test("TypeFox workers use Vite URLs with monaco-languageclient's Worker metadata", async () => {
  const source = await readFile(resolve(monacoRoot, "src/workers/configureTypeFoxWorkers.ts"), "utf8");
  const config = await readFile(resolve(monacoRoot, "src/workers/createMonacoVscodeWorkerConfig.ts"), "utf8");
  const packages = [
    "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js",
    "@codingame/monaco-vscode-standalone-typescript-language-features/worker",
    "@codingame/monaco-vscode-standalone-css-language-features/worker",
    "@codingame/monaco-vscode-standalone-json-language-features/worker",
    "@codingame/monaco-vscode-standalone-html-language-features/worker",
  ];
  for (const worker of packages) {
    expect(config).toContain(`${worker}?worker&url`);
  }
  expect(source).toContain('useWorkerFactory');
  expect(source).toContain('createMonacoVscodeWorkerConfig');
  expect(config).toContain("new Worker(new URL(");
  expect(config).toContain('type: "module"');
  expect(source).toContain("useWorkerFactory");
});

test("generated docs provide the Guide page linked by the starter navigation", async () => {
  const templates = resolve(
    import.meta.dirname,
    "../../packages/moyaforge-cli/templates",
  );
  const [app, welcome, guide] = await Promise.all([
    readFile(resolve(templates, "base/src/App.tsx"), "utf8"),
    readFile(resolve(templates, "docs/page.mdx"), "utf8"),
    readFile(resolve(templates, "docs/guide/page.mdx"), "utf8"),
  ]);
  expect(app).toContain('page.url === "/docs/guide"');
  expect(welcome).toContain("[Guide](/docs/guide)");
  expect(guide).toMatch(/^---\ntitle: Guide\n/);
  expect(guide).toContain("# Guide");
});
