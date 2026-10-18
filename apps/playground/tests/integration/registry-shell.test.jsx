import { test, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { MoyaForgeRouting } from "../../../../packages/moyaforge/src/routing/content-routing";
import { DocumentationSite } from "../../../../packages/moyaforge/src/components/Layout/DocsLayout/DocumentationSite";

test("shell respects configured source labels, order, and folders", () => {
  const pages = [
    {
      source: "docs",
      file: "topic/nested/page.mdx",
      path: "/docs/topic/nested",
      label: "Nested guide",
      navigation: "visible",
      order: 1,
    },
    {
      source: "packages",
      file: "page.mdx",
      path: "/packages",
      label: "Package home",
      navigation: "visible",
      order: 1,
    },
    {
      source: "docs",
      file: "secret/page.mdx",
      path: "/docs/secret",
      label: "Secret",
      navigation: "hidden",
      order: 2,
    },
  ];
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ["/packages"] },
      createElement(
        MoyaForgeRouting,
        { pages },
        createElement(
          DocumentationSite,
          {
            title: "Test",
            sources: {
              packages: { navigation: { label: "Libraries", order: 1 } },
              docs: { navigation: { label: "Handbook", order: 2 } },
            },
          },
          "Article",
        ),
      ),
    ),
  );
  expect(html.indexOf("Libraries</div>")).toBeLessThan(
    html.indexOf("Handbook</div>"),
  );
  expect(html).toContain('class="mf-folder">topic</span><ul>');
  expect(html).toContain("Nested guide");
  expect(html).not.toContain("Secret");
});
