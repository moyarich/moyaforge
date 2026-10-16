import { test, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { useMDXComponents } from "@mdx-js/react";
import { PlaygroundMdxProvider } from "../src/mdx-provider.jsx";

test("MDX resolves shared components through the playground provider", async () => {
  const { default: Content } = await evaluate(
    '<Demo><CodeGroup><CodeTab label="npm"><pre>npm install moyaforge</pre></CodeTab></CodeGroup></Demo>',
    {
      ...runtime,
      useMDXComponents,
    },
  );
  const html = renderToStaticMarkup(
    createElement(PlaygroundMdxProvider, null, createElement(Content)),
  );
  expect(html).toContain('data-moyaforge-demo=""');
  expect(html).toContain('role="tab"');
  expect(html).toContain("npm install moyaforge");
});

// Cold Shiki grammar/WASM initialization can exceed five seconds on CI runners.
test(
  "Shiki highlights fenced code through the shared MDX compiler",
  { timeout: 15_000 },
  async () => {
    const { default: rehypeShiki } = await import("@shikijs/rehype");
    const { createMdxOptions } = await import("@moyarich/moyaforge-mdx");
    const { default: Content } = await evaluate(
      '```js\nconst greeting = "hello";\n```',
      {
        ...runtime,
        useMDXComponents,
        ...createMdxOptions({
          shiki: [
            rehypeShiki,
            { themes: { light: "github-light", dark: "github-dark" } },
          ],
        }),
      },
    );
    const html = renderToStaticMarkup(
      createElement(PlaygroundMdxProvider, null, createElement(Content)),
    );
    expect(html).toContain('class="shiki shiki-themes');
    expect(html).toContain("--shiki-dark:");
    expect(html).toContain('class="line"');
    expect(html).toContain("greeting");
  },
);

test("MDX renders registered Lucide icons and forwards their props", async () => {
  const { default: Content } = await evaluate(
    '<Camera size={32} strokeWidth={1.5} aria-label="Camera preview" />',
    { ...runtime, useMDXComponents },
  );
  const html = renderToStaticMarkup(
    createElement(PlaygroundMdxProvider, null, createElement(Content)),
  );
  expect(html).toContain("<svg");
  expect(html).toContain('width="32"');
  expect(html).toContain('stroke-width="1.5"');
  expect(html).toContain('aria-label="Camera preview"');
});
