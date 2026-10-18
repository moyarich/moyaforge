import { describe, expect, it } from "vitest";
import { buildDocumentationGroups } from "../../dist/navigation.js";

const route = (source, path, order = 0, navigation = "visible") => ({
  source,
  path,
  order,
  navigation,
  file: "page.mdx",
  title: path,
});

describe("source-based documentation navigation", () => {
  it("orders and labels sources from registry configuration", () => {
    const groups = buildDocumentationGroups(
      [route("ui", "/ui/components/code-block"), route("docs", "/docs/intro")],
      {
        ui: { navigation: { label: "Components", order: 2 } },
        docs: { navigation: { label: "Guides", order: 1 } },
      },
    );
    expect(groups.map(({ source, label }) => [source, label])).toEqual([
      ["docs", "Guides"],
      ["ui", "Components"],
    ]);
    expect(groups[1].nodes[0].path).toBe("/ui/components");
  });

  it("keeps source landing pages and excludes hidden/disabled nodes", () => {
    const groups = buildDocumentationGroups([
      route("docs", "/docs"),
      route("docs", "/docs/guide"),
      route("docs", "/docs/hidden", 0, "hidden"),
      route("docs", "/docs/disabled", 0, "disabled"),
    ]);
    expect(groups[0].nodes.map(({ path }) => path)).toEqual(["/docs"]);
    expect(groups[0].nodes[0].children.map(({ path }) => path)).toEqual([
      "/docs/guide",
    ]);
  });

  it("flattens virtual source roots without inventing a landing page", () => {
    const groups = buildDocumentationGroups([route("docs", "/docs/guide")]);
    expect(groups[0].nodes.map(({ path }) => path)).toEqual(["/docs/guide"]);
  });
});
