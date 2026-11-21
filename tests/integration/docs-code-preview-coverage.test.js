import { existsSync, globSync, readFileSync, readdirSync } from "node:fs";
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
      // The counter's canonical source lives outside its example directory.
      // Keep the raw imports rather than copying it or weakening path guards.
      if (page === "220-code-preview/10-counter-in-mdx/page.mdx") {
        if (
          !source.includes("<CodePreview") ||
          !source.includes("../../CounterExample.tsx?raw") ||
          !source.includes("../../counterExample.css?raw")
        ) {
          missing.push(page);
        }
        continue;
      }
      if (!/:{3,4}code-preview\[/.test(source)) {
        missing.push(page);
        continue;
      }
      // React and inline Markdown (including raw style/script tags) capture
      // their authored body automatically. File-backed previews must attach
      // their source files explicitly.
      const hasInlineMarkdown =
        /:{3,4}code-preview\[[^\]\n]+\][^\n]*\r?\n\s*\r?\n\s*<(?:style|script)>/.test(
          source,
        );
      const selected = /preview="([^"]+)"/
        .exec(source)?.[1]
        .split(",")
        .map((name) => name.trim());
      const namedFences = [...source.matchAll(/filename="([^"]+)"/g)].map(
        (match) => match[1],
      );
      const hasSelectedSources =
        selected?.length &&
        selected.every((name) => namedFences.includes(name));
      if (
        !hasSelectedSources &&
        !/\{react(?:\s|\})/.test(source) &&
        !hasInlineMarkdown &&
        !/::code-preview-sources\{files=/.test(source)
      ) {
        missing.push(page);
      }
    }
    expect(missing, "Examples without a live preview and source code").toEqual(
      [],
    );
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
      for (const example of readdirSync(directory).filter((name) =>
        name.endsWith(".tsx"),
      )) {
        if (!references.some((reference) => reference.endsWith("/" + example)))
          missing.push(`${page}: ${example} is not in the source tabs`);
      }
    }
    expect(
      missing,
      "Missing or unlisted authored preview source files",
    ).toEqual([]);
  });
});
