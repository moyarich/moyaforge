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

vi.mock("../../packages/moyaforge-monaco/src/workers/configureTypeFoxWorkers.ts", () => ({
  configureTypeFoxWorkers: (config) => {
    if (typeof globalThis.MonacoEnvironment?.getWorker === "function") {
      throw new Error("Standalone Monaco workers are already configured");
    }
    mocks.typefoxSetup(config);
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

test("shared initialization preserves host configuration and starts once", async () => {
  globalThis.MonacoEnvironment = { extra: "preserved" };
  const { initializeMonacoVscodeRuntime } = await import(
    "../../packages/moyaforge-monaco/src/runtime/initializeMonacoVscodeRuntime.ts"
  );

  const first = initializeMonacoVscodeRuntime();
  const second = initializeMonacoVscodeRuntime();
  expect(first).toBe(second);
  await Promise.all([first, second]);

  expect(globalThis.MonacoEnvironment.extra).toBe("preserved");
  expect(globalThis.MonacoEnvironment.getWorker).toBeUndefined();
  expect(globalThis.MonacoEnvironment.getWorkerUrl("id", "typescript")).toBe(
    "/workers/typescript.js",
  );
  expect(
    globalThis.MonacoEnvironment.getWorkerOptions("id", "typescript"),
  ).toEqual({ type: "module" });
  expect(mocks.typefoxSetup).toHaveBeenCalledTimes(1);
  expect(mocks.loaderConfig).toHaveBeenCalledExactlyOnceWith({
    monaco: mocks.monaco,
  });
  expect(mocks.vscodeStart).toHaveBeenCalledTimes(1);
  expect(mocks.vscodeConfig).toHaveBeenCalledWith(
    expect.objectContaining({
      $type: "classic",
      viewsConfig: { $type: "EditorService" },
      monacoWorkerFactory: expect.any(Function),
    }),
  );
});

test("shared initialization refuses to override a standalone worker factory", async () => {
  const worker = vi.fn();
  globalThis.MonacoEnvironment = { getWorker: worker };
  const { initializeMonacoVscodeRuntime } = await import(
    "../../packages/moyaforge-monaco/src/runtime/initializeMonacoVscodeRuntime.ts"
  );

  await expect(initializeMonacoVscodeRuntime()).rejects.toThrow(
    /Standalone Monaco workers/,
  );
  expect(globalThis.MonacoEnvironment.getWorker).toBe(worker);
  expect(mocks.loaderConfig).not.toHaveBeenCalled();
  expect(mocks.vscodeStart).not.toHaveBeenCalled();
});

test("shared initialization passes worker and TypeScript options to TypeFox", async () => {
  const { initializeMonacoVscodeRuntime } = await import(
    "../../packages/moyaforge-monaco/src/runtime/initializeMonacoVscodeRuntime.ts"
  );
  const config = {
    workerLoaders: { custom: () => ({ url: "/custom.js" }) },
    typescript: {
      compilerOptions: { strict: true },
      declarationLibraries: {
        "file:///types/app.d.ts": "declare const appVersion: string;",
      },
    },
  };
  await initializeMonacoVscodeRuntime(config);
  expect(mocks.typefoxSetup).toHaveBeenCalledExactlyOnceWith(config);
});
