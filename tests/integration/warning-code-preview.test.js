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

test("Warning previews accept a source directive before inline React imports and render a file-backed Markdown component", async () => {
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
          "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
        },
      }),
    ),
  );

  expect(registered).toHaveLength(1);
  expect(registered[0].authoredFile).toBe(page);
  expect(registered[0].source).toContain('import "./example.css";');
  expect(registered[0].source).toMatch(/<CustomBlock\s+className="warning-example"/);
  expect(registered[0].source).not.toContain("code-preview-sources");
  expect(resolved).toEqual([{ reference: "./Example.tsx", authoredFile: page }]);
  expect(output).toContain("virtual:moyaforge-mdx/react-preview/warning");
  expect(output).toContain("warning/Example.tsx");
  expect(output).toContain("Example.mdx");
  expect(output).toContain("example.css");
  expect(output.match(/replacementPreset: "portable"/g)).toHaveLength(2);
  expect(output).toContain("Save a backup before changing your settings.");
});

test("the file-backed component renders the Markdown source and matches the CSS casing", async () => {
  const wrapper = await readFile(resolve(directory, "Example.tsx"), "utf8");
  const example = await readFile(resolve(directory, "Example.mdx"), "utf8");
  const styles = await readFile(resolve(directory, "example.css"), "utf8");

  expect(wrapper).toContain('import Example from "./Example.mdx";');
  expect(example).toContain('import "./example.css";');
  expect(example).toContain("::: warning Before you continue");
  expect(styles).toContain(".warning-example .custom-block.warning");
});
