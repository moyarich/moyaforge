import { cp, mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(root, "packages/moyaforge-cli");
const target = resolve(root, "github-cli");

// Preserve the CLI's package-relative layout: dist/scaffold.js resolves
// templates from ../templates. The root Git package is independent of
// npm workspace symlinks and the root monorepo source layout.
await stat(resolve(source, "dist/bin/moyaforge.js"));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(source, "dist"), resolve(target, "dist"), {
  recursive: true,
});
await cp(resolve(source, "templates"), resolve(target, "templates"), {
  recursive: true,
});
console.log("Prepared GitHub-root moyaforge CLI package");
