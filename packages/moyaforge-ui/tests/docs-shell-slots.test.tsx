import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsShellFocused } from "../src/components/DocsShellFocused/DocsShellFocused.js";
import { DocsShellWide } from "../src/components/DocsShellWide/DocsShellWide.js";

describe("independently composable documentation shells", () => {
  it("renders focused defaults and supports replacing or omitting them", () => {
    const defaults = renderToStaticMarkup(
      createElement(DocsShellFocused, {
        title: "Guide",
        backHref: "/docs",
        children: "Article",
      }),
    );
    expect(defaults).toContain("Guide");
    expect(defaults).toContain('href="/docs"');
    expect(defaults).toContain("Article");

    const replaced = renderToStaticMarkup(
      createElement(DocsShellFocused, {
        title: "Ignored",
        backHref: "/docs",
        header: createElement("span", null, "Custom heading"),
        navigation: null,
        children: "Article",
      }),
    );
    expect(replaced).toContain("Custom heading");
    expect(replaced).not.toContain("Ignored");
    expect(replaced).not.toContain('href="/docs"');
  });

  it("renders wide defaults and allows slots to be removed or replaced", () => {
    const defaults = renderToStaticMarkup(
      createElement(DocsShellWide, {
        title: "Reference",
        navigationItems: [{ label: "API", href: "/api" }],
        children: "Content",
      }),
    );
    expect(defaults).toContain("Reference");
    expect(defaults).toContain('href="/api"');

    const customized = renderToStaticMarkup(
      createElement(DocsShellWide, {
        title: "Ignored",
        navigationItems: [{ label: "API", href: "/api" }],
        header: null,
        navigation: createElement("span", null, "Custom nav"),
        inspector: createElement("span", null, "Inspector"),
        children: "Content",
      }),
    );
    expect(customized).not.toContain("Ignored");
    expect(customized).not.toContain('href="/api"');
    expect(customized).toContain("Custom nav");
    expect(customized).toContain("Inspector");
  });
});
