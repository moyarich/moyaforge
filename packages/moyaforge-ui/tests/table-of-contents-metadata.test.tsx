import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TableOfContents } from "../src/components/TableOfContents/TableOfContents.tsx";

describe("TableOfContents compiler metadata", () => {
  it("renders supplied headings without a browser DOM", () => {
    const html = renderToStaticMarkup(createElement(TableOfContents, {
      items: [{ id: "install", label: "Install", level: 2 }],
      root: null,
    }));
    expect(html).toContain('href="#install"');
    expect(html).toContain("Install");
    expect(html).toContain('data-level="2"');
  });

  it("does not scan the DOM when compiler headings are supplied", () => {
    const root = { querySelectorAll: () => { throw Error("unexpected DOM query"); } };
    expect(() => renderToStaticMarkup(createElement(TableOfContents, {
      items: [{ id: "usage", label: "Usage", level: 3 }],
      root,
    }))).not.toThrow();
  });
});
