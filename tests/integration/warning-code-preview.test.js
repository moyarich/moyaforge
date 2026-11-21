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

  expect(registered).toHaveLength(2);
  expect(registered[1].source).toContain(
    "export default function WarningExample",
  );
  expect(registered[0].authoredFile).toBe(page);
  expect(registered[0].source).toContain(
    "export default function WarningExample",
  );
  expect(registered[0].source).toMatch(
    /<CustomBlock\s+className="warning-example"/,
  );
  expect(registered[0].source).not.toContain("code-preview-sources");
  expect(resolved).toEqual([]);
  expect(output).toContain("virtual:moyaforge-mdx/react-preview/warning");
  expect(output).toContain("example.md");
  expect(output).toContain("_components.strong");
  expect(output).toContain("@scope (.mf-preview-fence-");
  expect(output).toContain("example.css");
  expect(output.match(/replacementPreset: "portable"/g)).toHaveLength(1);
  expect(output).toContain("Save me");
});

test("Markdown and CSS are authored inline without a React or documentation wrapper", async () => {
  const value = await readFile(page, "utf8");
  const markdown = /```md filename="example.md"\n([\s\S]*?)\n```/.exec(
    value,
  )?.[1];
  const css = /```css filename="example.css"\n([\s\S]*?)\n```/.exec(value)?.[1];
  expect(markdown).toContain("::: warning Before you continue");
  expect(markdown).not.toContain("code-preview");
  expect(markdown).not.toContain("import ");
  expect(value).toMatch(
    /preview="example\.md,example\.css(?:,example\.(?:sh|tsx))?"/,
  );
  expect(css).toContain(".custom-block.warning");
  expect(css).toContain("--mf-custom-block-border");
});
