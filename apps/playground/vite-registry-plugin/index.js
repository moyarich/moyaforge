import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import registry from "../registry.config";

const playgroundRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Vite integration reads configured roots; it never defines source globs. */
export function registryPlugin() {
  return {
    name: "moyaforge-playground-registry",
    configureServer(server) {
      const roots = Object.values(registry.sources).map(({ base }) =>
        resolve(playgroundRoot, base),
      );
      server.watcher.add(roots);
    },
  };
}
