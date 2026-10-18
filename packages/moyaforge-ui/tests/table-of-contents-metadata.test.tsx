import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TableOfContents } from "../src/components/TableOfContents/TableOfContents.tsx";
import {
  DocOutline,
  headingIdFromHash,
} from "../src/components/DocOutline/DocOutline.tsx";

describe("TableOfContents compiler metadata", () => {
  it("renders supplied headings without a browser DOM", () => {
    const html = renderToStaticMarkup(
      createElement(TableOfContents, {
        items: [{ id: "install", label: "Install", level: 2 }],
        root: null,
      }),
    );
    expect(html).toContain('href="#install"');
    expect(html).toContain("Install");
    expect(html).toContain('data-level="2"');
  });

  it("does not scan the DOM when compiler headings are supplied", () => {
    const root = {
      querySelectorAll: () => {
        throw Error("unexpected DOM query");
      },
    };
    expect(() =>
      renderToStaticMarkup(
        createElement(TableOfContents, {
          items: [{ id: "usage", label: "Usage", level: 3 }],
          root,
        }),
      ),
    ).not.toThrow();
  });
});

describe("DocOutline router integration", () => {
  it("renders host-supplied heading links without changing heading metadata", () => {
    const html = renderToStaticMarkup(
      createElement(DocOutline, {
        headings: [{ id: "install", value: "Install", depth: 2 }],
        renderLink: (item) =>
          createElement("a", { href: "/docs/guide#" + item.id }, item.label),
      }),
    );
    expect(html).toContain('href="/docs/guide#install"');
    expect(html).toContain("Install");
  });
});

describe("router-aware outline fragments", () => {
  it("reads BrowserRouter and HashRouter heading ids", () => {
    expect(headingIdFromHash("#installation")).toBe("installation");
    expect(headingIdFromHash("#/ui/components/code-block#installation")).toBe(
      "installation",
    );
    expect(headingIdFromHash("#/ui/components/code-block")).toBe("");
    expect(headingIdFromHash("#/docs/page#some%20heading")).toBe(
      "some heading",
    );
    expect(headingIdFromHash("#/docs/page#bad%ZZ")).toBe("bad%ZZ");
  });
});
