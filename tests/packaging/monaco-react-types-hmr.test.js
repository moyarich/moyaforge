import { EventEmitter } from "node:events";
import { resolve } from "node:path";
import { expect, test, vi } from "vitest";
import { monacoReactTypesPlugin } from "../../packages/moyaforge-monaco/src/vite.ts";

const virtualId = "virtual:moyaforge-monaco/react-types";
const resolvedId = String.fromCharCode(0) + virtualId;

test("Monaco declaration updates invalidate only the matching Vite virtual module", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const plugin = monacoReactTypesPlugin(root);
  const watched = [];
  const watcher = new EventEmitter();
  watcher.add = vi.fn();
  const module = {};
  const getModuleById = vi.fn(() => module);
  const invalidateModule = vi.fn();
  const send = vi.fn();

  plugin.configureServer({
    watcher,
    moduleGraph: { getModuleById, invalidateModule },
    ws: { send },
  });

  expect(plugin.resolveId(virtualId)).toBe(resolvedId);
  expect(plugin.resolveId("virtual:moyaforge-mdx/metadata")).toBeUndefined();

  const result = await plugin.load.call(
    { addWatchFile: (path) => watched.push(path) },
    resolvedId,
  );
  expect(result).toContain("export default");
  expect(watched.length).toBeGreaterThan(0);

  watcher.emit("change", resolve(root, "README.md"));
  expect(invalidateModule).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();

  watcher.emit("change", watched[0]);
  expect(getModuleById).toHaveBeenCalledWith(resolvedId);
  expect(invalidateModule).toHaveBeenCalledWith(module);
  expect(send).toHaveBeenCalledWith({ type: "full-reload" });

  watcher.emit("unlink", watched[1]);
  expect(invalidateModule).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenCalledTimes(2);
});
