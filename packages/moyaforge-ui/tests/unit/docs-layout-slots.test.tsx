import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout } from "../../src/components/Layout/DocsLayout/DocsLayout.tsx";

const pages = [
  { url: "/docs", title: "Docs" },
  { url: "/docs/guide", title: "Guide" },
];
const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    createElement(DocsLayout, {
      pages,
      currentUrl: "/docs/guide",
      children: "Article",
      ...props,
    }),
  );

describe("DocsLayout slots", () => {
  it("renders defaults when optional slots are omitted", () => {
    const html = render();
    expect(html).toContain("data-moyaforge-docs-header");
    expect(html).toContain("data-moyaforge-docs-sidebar");
    expect(html).toContain('aria-label="Documentation navigation"');
    expect(html).toContain("Article");
  });

  it("replaces slots with custom content", () => {
    const html = render({
      header: createElement("strong", null, "Custom header"),
      sidebar: createElement(
        "nav",
        { "aria-label": "Custom sidebar" },
        "Custom links",
      ),
      outline: createElement("aside", null, "Custom outline"),
      footer: createElement("small", null, "Custom footer"),
    });
    expect(html).toContain("Custom header");
    expect(html).toContain("Custom sidebar");
    expect(html).toContain("Custom outline");
    expect(html).toContain("Custom footer");
    expect(html).not.toContain('aria-label="Documentation navigation"');
  });

  it("explicit null removes slots without removing article content", () => {
    const html = render({
      header: null,
      sidebar: null,
      outline: null,
      footer: null,
    });
    expect(html).not.toContain('aria-label="Documentation navigation"');
    expect(html).not.toContain("data-moyaforge-docs-sidebar");
    expect(html).toContain("Article");
  });
  it("renders TOC links in each configured placement", () => {
    const toc = {
      headings: [
        { id: "installation", text: "Installation", depth: 2 },
        { id: "usage", text: "Usage", depth: 2 },
      ],
    };
    for (const placement of ["right", "sidebar", "inline"] as const) {
      const html = render({ toc: { ...toc, placement } });
      expect(html).toContain('href="#installation"');
      expect(html).toContain('href="#usage"');
      expect(html).toContain('aria-label="On this page"');
    }
    expect(render({ toc: { ...toc, placement: "none" } })).not.toContain(
      'href="#installation"',
    );
  });

});
