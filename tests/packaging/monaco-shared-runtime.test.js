import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loaderConfig: vi.fn(),
  typefoxSetup: vi.fn(),
  vscodeStart: vi.fn(async () => {}),
  vscodeConfig: vi.fn(),
  monaco: { editor: { create: vi.fn() } },
}));

vi.mock("@monaco-editor/react", () => ({
  loader: { config: mocks.loaderConfig },
}));

vi.mock("@codingame/monaco-vscode-editor-api", () => mocks.monaco);

vi.mock("monaco-languageclient/vscodeApiWrapper", () => ({
  MonacoVscodeApiWrapper: class {
    constructor(config) {
      mocks.vscodeConfig(config);
    }
    start() {
      return mocks.vscodeStart();
    }
  },
}));

vi.mock("../../packages/moyaforge-monaco/src/typefox.ts", () => ({
  configureTypeFoxWorkers: () => {
    mocks.typefoxSetup();
    globalThis.MonacoEnvironment ??= {};
    globalThis.MonacoEnvironment.getWorkerUrl = () => "/workers/typescript.js";
    globalThis.MonacoEnvironment.getWorkerOptions = () => ({ type: "module" });
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
afterEach(() => {
  delete globalThis.MonacoEnvironment;
});

test("shared configuration selects one Monaco runtime, preserves other environment fields, and is idempotent", async () => {
  const standardWorker = vi.fn();
  globalThis.MonacoEnvironment = { getWorker: standardWorker, extra: "preserved" };
  const { configureSharedMonacoWorkers } = await import("../../packages/moyaforge-monaco/src/shared.ts");

  configureSharedMonacoWorkers();
  configureSharedMonacoWorkers();

  expect(globalThis.MonacoEnvironment.getWorker).toBeUndefined();
  expect(globalThis.MonacoEnvironment.extra).toBe("preserved");
  expect(globalThis.MonacoEnvironment.getWorkerUrl("id", "typescript")).toBe("/workers/typescript.js");
  expect(globalThis.MonacoEnvironment.getWorkerOptions("id", "typescript")).toEqual({ type: "module" });
  expect(mocks.typefoxSetup).toHaveBeenCalledTimes(1);
  expect(mocks.loaderConfig).toHaveBeenCalledExactlyOnceWith({ monaco: mocks.monaco });
  const { isSharedMonacoRuntime } = await import("../../packages/moyaforge-monaco/src/runtime.ts");
  expect(isSharedMonacoRuntime()).toBe(true);
});

test("concurrent shared initialization starts the VS Code API once and waits before editors mount", async () => {
  const { initializeSharedMonaco } = await import("../../packages/moyaforge-monaco/src/shared.ts");
  const first = initializeSharedMonaco();
  const second = initializeSharedMonaco();

  expect(first).toBe(second);
  await Promise.all([first, second]);
  expect(mocks.typefoxSetup).toHaveBeenCalledTimes(1);
  expect(mocks.vscodeStart).toHaveBeenCalledTimes(1);
  expect(mocks.vscodeConfig).toHaveBeenCalledWith(expect.objectContaining({
    $type: "classic",
    viewsConfig: { $type: "EditorService" },
    monacoWorkerFactory: expect.any(Function),
  }));
});
