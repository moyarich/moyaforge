import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";

const directory = resolve(
  import.meta.dirname,
  "../../packages/moyaforge-ui/docs/01-components/01-custom-block/01-warning",
);
const page = resolve(directory, "page.mdx");

test("Warning previews accept a source directive before inline React imports and render Markdown examples", async () => {
  const value = await readFile(page, "utf8");
  const registered = [];
  const resolved = [];
  const output = String(
    await compile(
      { value, path: page },
      createMdxOptions({
        componentMappings: {
          "code-preview": {
            component: "InlineCodePreview",
            titleProp: "title",
            sourceProp: "code",
            filesProp: "sourceFiles",
            localSources: true,
            registerInlineReact(source, authoredFile) {
              registered.push({ source, authoredFile });
              return "virtual:moyaforge-mdx/react-preview/warning";
            },
            resolveCodePreviewComponent(reference, authoredFile) {
              resolved.push({ reference, authoredFile });
              return reference === "./Example.tsx"
                ? "warning/Example.tsx"
                : undefined;
            },
          },
          "*": {
            component: "CustomBlock",
            typeProp: "type",
            titleProp: "title",
          },
        },
      }),
    ),
  );

  expect(registered).toHaveLength(1);
  expect(registered[0].authoredFile).toBe(page);
  expect(registered[0].source).toContain('import "./example.css";');
  expect(registered[0].source).toMatch(
    /<CustomBlock\s+className="warning-example"/,
  );
  expect(registered[0].source).not.toContain("code-preview-sources");
  expect(resolved).toEqual([]);
  expect(output).toContain("virtual:moyaforge-mdx/react-preview/warning");
  expect(output).toContain("example.md");
  expect(output).toContain("_components.strong");
  expect(output).toContain("Example.mdx");
  expect(output).toContain("example.css");
  expect(output.match(/replacementPreset: "portable"/g)).toHaveLength(1);
  expect(output).toContain("Save a backup before changing your settings.");
});

test("Markdown source stays free of documentation wrappers and the page supplies its styling", async () => {
  const example = await readFile(resolve(directory, "Example.mdx"), "utf8");
  const value = await readFile(page, "utf8");
  const styles = await readFile(resolve(directory, "example.css"), "utf8");

  expect(example).toContain("::: warning Before you continue");
  expect(example).not.toContain("code-preview");
  expect(example).not.toContain("import ");
  expect(value).toContain('preview="example.md"');
  expect(value).toContain('filename="example.css"');
  expect(styles).toContain(".warning-example .custom-block.warning");
});
