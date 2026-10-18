import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { remarkSourceLinks } from "../../src/remark-source-links.ts";

const config = { sources: { ui: { base: "../../packages/moyaforge-ui/docs", include: ["**/page.mdx"] } } };
const root = "/project/apps/playground";
const routes = [
  { source: "ui", file: "page.mdx", path: "/ui", navigation: "visible" },
  { source: "ui", file: "01-components/01-code-block/page.mdx", path: "/ui/components/code-block", navigation: "visible" },
];
async function parse(content) {
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkSourceLinks, { config, root, routes });
  const tree = processor.parse(content);
  return processor.run(tree, { path: "/project/packages/moyaforge-ui/docs/page.mdx" });
}
describe("repository source links", () => {
  it("maps a GitHub-readable source link to a public route with fragment", async () => {
    const tree = await parse("[Code Block](./01-components/01-code-block/page.mdx#usage)");
    expect(tree.children[0].url).toBe("/ui/components/code-block#usage");
  });
  it("maps literal MDX anchors", async () => {
    const tree = await parse('<a href="./01-components/01-code-block/page.mdx">Code</a>');
    expect(tree.children[0].attributes.find(a => a.name === "href").value).toBe("/ui/components/code-block");
  });
  it("leaves external, public-route, and unknown links intact", async () => {
    const tree = await parse("[External](https://example.org) [Route](/ui/components/code-block) [Unknown](./missing/page.mdx)");
    expect(tree.children[0].children.filter(n => n.type === "link").map(n => n.url)).toEqual([
      "https://example.org", "/ui/components/code-block", "./missing/page.mdx",
    ]);
  });
});
