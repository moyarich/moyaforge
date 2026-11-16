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
    if (typeof globalThis.MonacoEnvironment?.getWorker === "function") {
      throw new Error("Standalone Monaco workers are already configured");
    }
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

test("shared initialization preserves host configuration and starts the VS Code API once", async () => {
  globalThis.MonacoEnvironment = { extra: "preserved" };
  const { initializeSharedMonaco } = await import("../../packages/moyaforge-monaco/src/shared.ts");

  const first = initializeSharedMonaco();
  const second = initializeSharedMonaco();
  expect(first).toBe(second);
  await Promise.all([first, second]);

  expect(globalThis.MonacoEnvironment.extra).toBe("preserved");
  expect(globalThis.MonacoEnvironment.getWorker).toBeUndefined();
  expect(globalThis.MonacoEnvironment.getWorkerUrl("id", "typescript")).toBe("/workers/typescript.js");
  expect(globalThis.MonacoEnvironment.getWorkerOptions("id", "typescript")).toEqual({ type: "module" });
  expect(mocks.typefoxSetup).toHaveBeenCalledTimes(1);
  expect(mocks.loaderConfig).toHaveBeenCalledExactlyOnceWith({ monaco: mocks.monaco });
  expect(mocks.vscodeStart).toHaveBeenCalledTimes(1);
  expect(mocks.vscodeConfig).toHaveBeenCalledWith(expect.objectContaining({
    $type: "classic",
    viewsConfig: { $type: "EditorService" },
    monacoWorkerFactory: expect.any(Function),
  }));
});

test("shared initialization refuses to override a standalone worker factory", async () => {
  const worker = vi.fn();
  globalThis.MonacoEnvironment = { getWorker: worker };
  const { initializeSharedMonaco } = await import("../../packages/moyaforge-monaco/src/shared.ts");

  await expect(initializeSharedMonaco()).rejects.toThrow(/Standalone Monaco workers/);
  expect(globalThis.MonacoEnvironment.getWorker).toBe(worker);
  expect(mocks.loaderConfig).not.toHaveBeenCalled();
  expect(mocks.vscodeStart).not.toHaveBeenCalled();
});
