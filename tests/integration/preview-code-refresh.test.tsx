import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { PreviewCode } from "../../packages/moyaforge-ui/src/components/PreviewCode/PreviewCode.js";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";

const files = [{ label: "message.md", code: "Hello", language: "md" }];
test("refresh is opt-in and the button is accessible", () => {
  expect(
    renderToStaticMarkup(
      <PreviewCode title="Message" files={files}>
        <p>Hello</p>
      </PreviewCode>,
    ),
  ).not.toContain('aria-label="Refresh preview"');
  expect(
    renderToStaticMarkup(
      <PreviewCode title="Message" files={files} refresh>
        <p>Hello</p>
      </PreviewCode>,
    ),
  ).toContain('aria-label="Refresh preview"');
});
test("the directive forwards the refresh flag to its renderer", async () => {
  const output = String(
    await compile(
      '::::preview-code[Message]{refresh preview="message.md"}\n\n```md filename="message.md"\nHello\n```\n\n::::',
      createMdxOptions({
        componentMappings: {
          "preview-code": {
            component: "PreviewCode",
            directPreviewCode: true,
            titleProp: "title",
          },
        },
      }),
    ),
  );
  expect(output).toContain("refresh: true");
});
