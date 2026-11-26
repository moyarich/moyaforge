import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile, evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";
import {
  CodeGroup,
  CodeTab,
} from "../../packages/moyaforge-ui/src/components/CodeGroup/index.js";
import ReactExample from "../../packages/moyaforge-ui/docs/01-components/20-code-group/30-tabs-in-react/PackageManagerTabs.js";

const root = resolve("packages/moyaforge-ui/docs/01-components/20-code-group");
const mappings = {
  "preview-code": {
    component: "Preview",
    filesProp: "files",
    sourceProp: "code",
    localSources: true,
    resolvePreviewCodeComponent: () => "react/Example.tsx",
  },
  "code-group": {
    component: "CodeGroup",
    childType: "tab",
    childComponent: "CodeTab",
  },
};
test.each([
  "page.mdx",
  "10-tabs-in-md/page.mdx",
  "20-tabs-in-mdx/page.mdx",
  "30-tabs-in-react/page.mdx",
])("%s compiles with the documentation mappings", async (name) => {
  const path = resolve(root, name);
  await expect(
    compile(
      { path, value: await readFile(path, "utf8") },
      createMdxOptions({ componentMappings: mappings }),
    ),
  ).resolves.toBeDefined();
});
function expectTabs(html: string) {
  expect(html).toContain('role="tablist"');
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain(">npm</button>");
  expect(html).toContain(">pnpm</button>");
  expect(html).toContain("npm install react");
  expect(html).toContain("pnpm add react");
  expect(html).toContain("Copy npm code");
}
test("the selected Markdown source renders actual CodeGroup tabs", async () => {
  const page = await readFile(resolve(root, "10-tabs-in-md/page.mdx"), "utf8");
  const value = /````md filename="example.md"\n([\s\S]*?)\n````/.exec(page)![1];
  const { default: Example } = await evaluate(value, {
    ...runtime,
    ...createMdxOptions({ componentMappings: mappings }),
    format: "md",
    useMDXComponents: () => ({ CodeGroup, CodeTab }),
  });
  expectTabs(renderToStaticMarkup(<Example />));
});
test("MDX imports and React examples render the same working tab controls", async () => {
  const value = await readFile(
    resolve(root, "20-tabs-in-mdx/PackageManagerTabs.mdx"),
    "utf8",
  );
  const options = createMdxOptions({
    additionalRemarkPlugins: [
      () => (tree) => {
        tree.children = tree.children.filter(
          (node) => node.type !== "mdxjsEsm",
        );
      },
    ],
  });
  const { default: Example } = await evaluate(value, {
    ...runtime,
    ...options,
    useMDXComponents: () => ({ CodeGroup, CodeTab }),
  });
  expectTabs(renderToStaticMarkup(<Example />));
  expectTabs(renderToStaticMarkup(<ReactExample />));
});
