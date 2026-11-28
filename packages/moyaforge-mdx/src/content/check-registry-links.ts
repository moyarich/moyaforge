import { resolve } from "node:path";
import { checkContentLinks, formatLinkIssues } from "./check-links.js";

/**
 * Load a registry configuration module through Vite SSR.
 * Closes the temporary middleware-mode Vite server even if loading fails.
 * @param root - Application root.
 * @param configPath - Absolute or root-relative configuration module path.
 * @returns A promise resolving to the module's default export.
 */
export async function loadRegistryConfig(root: string, configPath: string) {
  const { createServer } = await import("vite");
  const server = await createServer({
    root,
    configFile: false,
    appType: "custom",
    server: { middlewareMode: true },
  });

  try {
    const mod = await server.ssrLoadModule(resolve(root, configPath));
    return mod.default;
  } finally {
    await server.close();
  }
}

/**
 * Run link validation against a Vite-loaded registry configuration.
 * Reports results to the console and sets process.exitCode to 1 when issues exist.
 * @param root - Application root.
 * @param configPath - Registry configuration module path.
 * @returns A promise that resolves after reporting results.
 */
export async function checkRegistryLinks(root: string, configPath: string) {
  const registry = await loadRegistryConfig(root, configPath);

  const issues = await checkContentLinks(registry, root);

  if (issues.length) {
    console.error(formatLinkIssues(issues));
    console.error(`Found ${issues.length} invalid internal content link(s).`);
    process.exitCode = 1;
  } else {
    console.log("All registered internal documentation links are valid.");
  }
}
