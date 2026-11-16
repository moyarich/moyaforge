import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const docs = resolve(
  import.meta.dirname,
  "../../packages/moyaforge-ui/docs/01-components",
);

const examplePages = globSync("**/page.mdx", { cwd: docs })
  .filter((page) => page.split("/").length === 3)
  .sort();

describe("component documentation examples", () => {
  test("every example page presents a preview with its authored code", () => {
    expect(examplePages.length).toBeGreaterThan(30);

    const missing = [];
    for (const page of examplePages) {
      const source = readFileSync(resolve(docs, page), "utf8");
      if (!/:{3,4}code-preview\[/.test(source)) {
        missing.push(page);
        continue;
      }
      // React blocks capture their body automatically. File-backed previews
      // must explicitly attach authored files to the Code tab.
      if (
        !/\{react(?:\s|\})/.test(source) &&
        !/::code-preview-sources\{files=/.test(source)
      ) {
        missing.push(page);
      }
    }
    expect(missing, "Examples without a live preview and source code").toEqual([]);
  });

  test("source tabs refer to real files, and sibling React examples expose their TSX", () => {
    const missing = [];
    for (const page of examplePages) {
      const filename = resolve(docs, page);
      const directory = dirname(filename);
      const mdx = readFileSync(filename, "utf8");
      const references = [
        ...mdx.matchAll(/::code-preview-sources\{files="([^"]+)"/g),
      ].flatMap((match) => match[1].split(",").map((path) => path.trim()));

      for (const reference of references) {
        if (!existsSync(resolve(directory, reference))) {
          missing.push(`${page}: ${reference}`);
        }
      }
      if (
        existsSync(resolve(directory, "Example.tsx")) &&
        !references.some((reference) => reference.endsWith("/Example.tsx"))
      ) {
        missing.push(`${page}: Example.tsx is not in the source tabs`);
      }
    }
    expect(missing, "Missing or unlisted authored preview source files").toEqual([]);
  });
});
