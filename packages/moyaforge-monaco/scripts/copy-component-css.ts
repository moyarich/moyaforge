import { copyFileSync, globSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/**
 * Publish original CSS paths referenced by generated .d.ts files.
 * TypeScript resolves arbitrary CSS assets via matching *.d.css.ts modules.
 */
for (const source of globSync("src/components/**/*.css", { cwd: root })) {
  const target = resolve(root, "dist", source.slice("src/".length));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(root, source), target);
  writeFileSync(target.replace(/\.css$/, ".d.css.ts"), "export {};\n");
}
