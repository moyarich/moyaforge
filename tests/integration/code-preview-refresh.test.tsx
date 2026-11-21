import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { CodePreview } from "../../packages/moyaforge-ui/src/components/CodePreview/CodePreview.js";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";

const files = [{ label: "message.md", code: "Hello", language: "md" }];
test("refresh is opt-in and the button is accessible", () => {
  expect(
    renderToStaticMarkup(
      <CodePreview title="Message" files={files}>
        <p>Hello</p>
      </CodePreview>,
    ),
  ).not.toContain('aria-label="Refresh preview"');
  expect(
    renderToStaticMarkup(
      <CodePreview title="Message" files={files} refresh>
        <p>Hello</p>
      </CodePreview>,
    ),
  ).toContain('aria-label="Refresh preview"');
});
test("the directive forwards the refresh flag to its renderer", async () => {
  const output = String(
    await compile(
      '::::code-preview[Message]{refresh preview="message.md"}\n\n```md filename="message.md"\nHello\n```\n\n::::',
      createMdxOptions({
        componentMappings: {
          "code-preview": {
            component: "InlineCodePreview",
            filesProp: "sourceFiles",
            sourceProp: "code",
            booleanProps: ["refresh"],
          },
        },
      }),
    ),
  );
  expect(output).toContain("refresh: true");
});
