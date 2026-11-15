import { resolve } from "node:path";
import { createServer } from "vite";
import { checkContentLinks, formatLinkIssues } from "./check-links.js";

export async function loadRegistryConfig(root: string, configPath: string) {
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
