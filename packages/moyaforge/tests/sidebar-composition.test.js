import { test, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout } from "../dist/components/Layout/DocsLayout/DocsLayout.js";
import { SidebarV2 } from "../dist/components/SidebarV2/index.js";

const render = (sidebar) =>
  renderToStaticMarkup(
    h(
      DocsLayout,
      {
        pages: [],
        sidebar,
        toc: false,
      },
      h("p", null, "Article"),
    ),
  );

test("DocsLayout accepts SidebarV2 as the complete sidebar slot", () => {
  const html = render(
    h(SidebarV2, { "data-custom-sidebar": "" }, "Custom navigation"),
  );
  expect(html).toContain('data-moyaforge-sidebar=""');
  expect(html).toContain("Custom navigation");
  expect(html).not.toContain("data-moyaforge-docs-sidebar");
  expect(html).toContain("Article");
});
test("DocsLayout defaults to SidebarV1 and allows omitting the sidebar", () => {
  expect(render(undefined)).toContain("data-moyaforge-docs-sidebar");
  expect(render(null)).not.toContain("data-moyaforge-docs-sidebar");
});

test("documentation shell forwards optional sidebar metadata and outline slots", async () => {
  const { MemoryRouter } = await import("react-router-dom");
  const { MoyaForgeRouting } =
    await import("../dist/components/Routing/content-routing.js");
  const { DocumentationSite } =
    await import("../dist/components/Layout/DocsLayout/DocumentationSite.js");
  const renderSite = (props) =>
    renderToStaticMarkup(
      h(
        MemoryRouter,
        null,
        h(
          MoyaForgeRouting,
          { pages: [] },
          h(DocumentationSite, { title: "Docs", ...props }, "Content"),
        ),
      ),
    );
  const defaults = renderSite({});
  expect(defaults).not.toContain('class="mf-version"');
  expect(defaults).not.toContain("v0.1");
  const configured = renderSite({
    sidebarLabel: "Product",
    sidebarVersion: "v2",
    outline: h("aside", { "data-custom-outline": "" }, "Custom outline"),
  });
  expect(configured).toContain("Product<span>v2</span>");
  expect(configured).toContain("data-custom-outline");
  expect(configured).not.toContain('class="mf-outline"');
  expect(renderSite({ outline: null })).not.toContain('class="mf-outline"');
  expect(
    renderSite({ sidebarHeader: h("strong", null, "Custom header") }),
  ).toContain("<strong>Custom header</strong>");
});

test("SidebarV1 children replace generated navigation while other slots remain independent", async () => {
  const { SidebarV1 } = await import("../dist/components/SidebarV1/index.js");
  const groups = [
    {
      source: "docs",
      label: "Generated navigation",
      nodes: [{ path: "/docs", children: [] }],
    },
  ];
  const renderSidebar = (props) => renderToStaticMarkup(h(SidebarV1, props));
  const html = renderSidebar({
    groups,
    header: h("header", null, "Header slot"),
    children: h("nav", null, "Custom navigation"),
    outline: "Outline slot",
    footer: "Footer slot",
  });
  expect(html).toContain("Custom navigation");
  expect(html).not.toContain("Generated navigation");
  expect(html.indexOf("Header slot")).toBeLessThan(
    html.indexOf("Custom navigation"),
  );
  expect(html.indexOf("Custom navigation")).toBeLessThan(
    html.indexOf("Outline slot"),
  );
  expect(html.indexOf("Outline slot")).toBeLessThan(
    html.indexOf("Footer slot"),
  );
  const noGroups = renderSidebar({
    header: "Header slot",
    children: "Custom navigation",
    footer: "Footer slot",
  });
  expect(noGroups).toContain("Header slot");
  expect(noGroups).toContain("Footer slot");
  expect(renderSidebar({ groups, children: null })).not.toContain(
    "Generated navigation",
  );
  expect(
    renderSidebar({
      label: "Default label",
      version: "v2",
      header: null,
      children: null,
    }),
  ).not.toContain("Default label");
  expect(
    renderToStaticMarkup(
      h(DocsLayout, { pages: [], outline: null }, "Article"),
    ),
  ).not.toContain("data-moyaforge-doc-outline");
});
