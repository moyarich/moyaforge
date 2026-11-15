import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { checkRegistryLinks } from "@moyarich/moyaforge-mdx";

const configFile = fileURLToPath(
  new URL("../registry.config.ts", import.meta.url),
);
const root = dirname(configFile);

await checkRegistryLinks(root, configFile).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
