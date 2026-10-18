import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { DocumentationLink, resolveDocumentationHref } from "../src/components/DocumentationLink.jsx";

describe("playground MDX links", () => {
  it("resolves relative, absolute and fragment links to canonical routes", () => {
    expect(resolveDocumentationHref("./setup", "/docs/guide")).toBe("/docs/guide/setup");
    expect(resolveDocumentationHref("../intro#installation", "/docs/guide")).toBe("/docs/intro#installation");
    expect(resolveDocumentationHref("#examples", "/docs/guide")).toBe("/docs/guide#examples");
    expect(resolveDocumentationHref("/ui/components/button", "/docs/guide")).toBe("/ui/components/button");
    expect(resolveDocumentationHref("./page.mdx", "/docs/guide")).toBe("/docs/guide");
  });
  it("does not rewrite external links", () => {
    expect(resolveDocumentationHref("https://github.com/moyarich/moyaforge", "/docs")).toBeNull();
    expect(resolveDocumentationHref("mailto:team@example.com", "/docs")).toBeNull();
    expect(resolveDocumentationHref("//example.com", "/docs")).toBeNull();
  });
  it("renders internal links as router navigation and external links as anchors", () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/docs/guide"] },
      createElement("div", null,
        createElement(DocumentationLink, { href: "#setup" }, "Setup"),
        createElement(DocumentationLink, { href: "https://example.com" }, "External"),
      )));
    expect(html).toContain('href="/docs/guide#setup"');
    expect(html).toContain('href="https://example.com"');
  });
});
