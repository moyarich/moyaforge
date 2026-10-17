import { describe, expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout } from "../src/components/Layout/DocsLayout/index.ts";
import { SidebarV2 } from "../src/components/SidebarV2/index.ts";
import { DocOutline } from "../src/components/DocOutline/index.ts";

const render = (component) => renderToStaticMarkup(component);

describe("source-owned documentation UI", () => {
  test("DocsLayout renders visible navigation but omits hidden and disabled pages", () => {
    const pages = [
      { url: "/visible", title: "Visible" },
      {
        url: "/hidden",
        title: "Hidden",
        frontmatter: { navigation: "hidden" },
      },
      {
        url: "/disabled",
        title: "Disabled",
        frontmatter: { navigation: "disabled" },
      },
    ];
    const html = render(
      h(DocsLayout, { pages, currentUrl: "/visible" }, h("p", null, "Article")),
    );
    expect(html).toContain('href="/visible"');
    expect(html).not.toContain('href="/hidden"');
    expect(html).not.toContain('href="/disabled"');
    expect(html).toContain("Article");
  });

  test("DocsLayout supports an injected SidebarV2 instead of generated navigation", () => {
    const html = render(
      h(
        DocsLayout,
        {
          pages: [{ url: "/generated", title: "Generated" }],
          sidebar: h(SidebarV2, null, "Custom navigation"),
          toc: false,
        },
        h("p", null, "Article"),
      ),
    );
    expect(html).toContain("Custom navigation");
    expect(html).not.toContain('href="/generated"');
    expect(html).toContain("Article");
  });

  test("DocOutline renders exact heading anchors", () => {
    const html = render(
      h(DocOutline, {
        headings: [{ id: "setup", value: "Setup", depth: 2 }],
        collapsible: false,
      }),
    );
    expect(html).toContain('href="#setup"');
  });
});
