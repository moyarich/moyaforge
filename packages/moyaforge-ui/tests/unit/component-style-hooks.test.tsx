import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Demo } from "../../src/components/Demo/Demo.tsx";
import { DocOutline } from "../../src/components/DocOutline/DocOutline.tsx";
import { DocsShellFocused } from "../../src/components/DocsShellFocused/DocsShellFocused.tsx";
import { DocsShellWide } from "../../src/components/DocsShellWide/DocsShellWide.tsx";
import { EditPageLink } from "../../src/components/EditPageLink/EditPageLink.tsx";
import { DocsLayout } from "../../src/components/Layout/DocsLayout/DocsLayout.tsx";
import { DocumentationSite } from "../../src/components/Layout/DocumentationSite/DocumentationSite.tsx";
import { NavigationTree } from "../../src/components/NavigationTree/NavigationTree.tsx";
import { Page } from "../../src/components/Page/Page.tsx";
import { DocumentationSearch } from "../../src/components/Search/DocumentationSearch.tsx";
import { Search } from "../../src/components/Search/Search.tsx";
import { Sidebar } from "../../src/components/SidebarV2/Sidebar.tsx";
import { Source } from "../../src/components/Source/Source.tsx";
import { TableOfContents } from "../../src/components/TableOfContents/TableOfContents.tsx";
import { VersionPicker } from "../../src/components/VersionPicker/VersionPicker.tsx";

const render = (component: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(component);

describe("class-based component styling hooks", () => {
  it("sets classes for primitives and composes caller classes", () => {
    expect(render(h(Demo, { className: "user-demo" }, "Example"))).toContain(
      'class="mf-demo user-demo"',
    );
    expect(render(h(Demo, null, "Example"))).toContain('data-moyaforge-demo=""');
    expect(render(h(Page, { as: "article", className: "my-page" }, "Page")))
      .toContain('class="mf-page my-page"');
    expect(render(h(Search, { className: "my-search" })))
      .toContain('class="mf-search-control my-search"');
    expect(render(h(Source, { className: "my-source" }, h("code", null, "Hi"))))
      .toContain('class="mf-source my-source"');
    expect(render(h(NavigationTree, {
      items: [],
      listProps: { className: "my-tree" },
    }))).toContain('class="mf-navigation-tree my-tree"');
    expect(render(h(EditPageLink, {
      repository: "moyarich/moyaforge",
      path: "docs/page.mdx",
      className: "my-link",
    }))).toContain('class="mf-edit-page my-link"');
  });

  it("sets classes for outlines, nesting levels and version pickers", () => {
    const outline = render(h(DocOutline, {
      headings: [{ id: "advanced", value: "Advanced", depth: 3 }],
      className: "my-outline",
    }));
    expect(outline).toContain('class="mf-doc-outline my-outline"');
    expect(outline).toContain('class="mf-level-3"');
    expect(outline).toContain('class="mf-doc-outline-title"');

    const toc = render(h(TableOfContents, {
      items: [{ id: "advanced", label: "Advanced", level: 3 }],
      root: null,
    }));
    expect(toc).toContain('class="mf-toc"');
    expect(toc).toContain('class="mf-level-3"');
    expect(toc).toContain('data-level="3"');

    expect(render(h(VersionPicker, {
      versions: [{ label: "v1", value: "v1" }],
      current: "v1",
      className: "my-version",
    }))).toContain('class="mf-version-picker my-version"');
  });

  it("styles shell slots and merges custom sidebar classes", () => {
    const focused = render(h(DocsShellFocused, {
      title: "Guide", footer: "Footer", children: "Body",
    }));
    for (const name of [
      "mf-shell-focused", "mf-focused-header",
      "mf-focused-article", "mf-focused-footer",
    ]) expect(focused).toContain(name);

    const wide = render(h(DocsShellWide, {
      title: "Workspace", navigation: "Navigation",
      inspector: "Inspector", toolbar: "Toolbar",
      footer: "Footer", children: "Body",
    }));
    for (const name of [
      "mf-shell-wide", "mf-wide-header", "mf-wide-toolbar",
      "mf-wide-grid", "mf-wide-navigation", "mf-wide-content",
      "mf-wide-inspector", "mf-wide-footer",
    ]) expect(wide).toContain(name);

    const sidebar = render(h(Sidebar, { className: "my-sidebar" }, "Sidebar"));
    expect(sidebar).toContain('class="mf-sidebar-v2 my-sidebar"');
    expect(sidebar).toContain('data-moyaforge-sidebar=""');
    const layout = render(h(DocsLayout, { pages: [], children: "Text" }));
    expect(layout).toContain("mf-docs-layout");
    expect(layout).toContain("mf-docs-sidebar");
    expect(layout).toContain("mf-docs-article");
  });

  it("derives responsive and presentation classes from props", () => {
    const docs = render(h(DocumentationSite, {
      title: "Docs", sidebar: null, outline: null, children: "Content",
    }));
    expect(docs).toContain("mf-no-sidebar");
    expect(docs).toContain("mf-no-outline");
    expect(docs).not.toContain("data-sidebar=");
    expect(docs).not.toContain("data-outline=");

    const search = render(h(DocumentationSearch, {
      search: async () => [],
      resultsPosition: "inline",
    }));
    expect(search).toContain('class="mf-search is-inline"');
    expect(search).not.toContain("data-results-position=");
  });
});
