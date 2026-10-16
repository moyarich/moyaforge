import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const pkg = resolve(import.meta.dirname, "../packages/moyaforge");
const source = join(pkg, "src/components");
const output = join(pkg, "dist/components");

async function copyStyles(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const filename = join(folder, entry.name);
    if (entry.isDirectory()) {
      await copyStyles(filename);
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      const destination = join(output, relative(source, filename));
      await mkdir(dirname(destination), { recursive: true });
      await cp(filename, destination);
    }
  }
}

await copyStyles(source);
