import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentationSite } from "../src/components/Layout/DocumentationSite/DocumentationSite.tsx";

describe("documentation contribution link", () => {
  it("opens the current page source on GitHub", () => {
    const html = renderToStaticMarkup(createElement(DocumentationSite, {
      title: "Docs",
      repository: "https://github.com/moyarich/moyaforge",
      pages: [{ path: "/docs/guide", label: "Guide", sourcePath: "docs/guide/page.mdx" }],
      currentPath: "/docs/guide",
      children: "Content",
    }));
    expect(html).toContain('href="https://github.com/moyarich/moyaforge/edit/main/docs/guide/page.mdx"');
    expect(html).toContain("Contribute on GitHub");
  });

  it("falls back to the repository when page source is unavailable", () => {
    const html = renderToStaticMarkup(createElement(DocumentationSite, {
      title: "Docs",
      repository: "https://github.com/moyarich/moyaforge",
      pages: [{ path: "/docs", label: "Docs" }],
      currentPath: "/docs",
      children: "Content",
    }));
    expect(html).toContain('href="https://github.com/moyarich/moyaforge" target="_blank" rel="noopener noreferrer">Contribute on GitHub');
  });
});
