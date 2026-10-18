import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout } from "../src/components/Layout/DocsLayout/DocsLayout.js";

const pages = [{ url: "/guide", title: "Guide" }];
const headings = [{ id: "intro", text: "Introduction", depth: 2 }];

function render(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(DocsLayout, {
      pages,
      currentUrl: "/guide",
      children: createElement("h2", { id: "intro" }, "Introduction"),
      toc: { headings, collapsible: true, ...((props.toc as object) ?? {}) },
      ...Object.fromEntries(
        Object.entries(props).filter(([key]) => key !== "toc"),
      ),
    }),
  );
}

describe("DocsLayout TOC disclosure", () => {
  it("uses native details and defaults open for collapsible outlines", () => {
    const html = render();
    expect(html).toContain("<details");
    expect(html).toContain('open=""');
    expect(html).toContain("<summary>On this page</summary>");
    expect(html).toContain('href="#intro"');
  });

  it("supports collapsed-by-default TOC", () => {
    const html = render({ toc: { defaultOpen: false } });
    expect(html).toContain("<details");
    expect(html).not.toContain('open=""');
  });

  it("keeps non-collapsible outlines and explicit slots unchanged", () => {
    const plain = render({ toc: { collapsible: false } });
    expect(plain).not.toContain("<details");
    expect(plain).toContain("<strong>On this page</strong>");

    const custom = render({
      outline: createElement("aside", null, "Custom outline"),
    });
    expect(custom).toContain("Custom outline");
    expect(custom).not.toContain("<details");
  });
});
