import { test, expect } from "vitest";
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";
import { createContentRouting } from "../../../../packages/moyaforge/src/routing/content-routing";

const pages: NormalizedPage[] = (
  [
    {
      source: "docs",
      file: "02-hidden/page.mdx",
      path: "/docs/hidden",
      navigation: "hidden",
    },
    {
      source: "docs",
      file: "01-guide/page.mdx",
      path: "/docs/guide",
      navigation: "visible",
    },
    {
      source: "docs",
      file: "03-disabled/page.mdx",
      path: "/docs/disabled",
      navigation: "disabled",
    },
  ] as const
).map((page, order) => ({
  ...page,
  title: page.path,
  label: page.path,
  order,
  toc: false,
  parentPath: null,
}));
test("canonical routes exclude disabled pages while preserving hidden pages", () => {
  const routing = createContentRouting(pages);
  expect(routing.firstContentRoute()).toBe("/docs/guide");
  expect(routing.normalizeRoute("/docs/guide/")).toBe("/docs/guide");
  expect(routing.normalizeRoute("/docs/hidden")).toBe("/docs/hidden");
  expect(routing.normalizeRoute("/docs/disabled")).toBeNull();
  expect(routing.normalizeRoute("//evil.test")).toBeNull();
  expect(routing.normalizeRoute("/missing")).toBeNull();
});
test("search keys resolve against canonical routes rather than inferred URL paths", () => {
  const routing = createContentRouting(pages);
  expect(routing.searchResultRoute("docs/01-guide/page.mdx")).toBe(
    "/docs/guide",
  );
  expect(
    routing.searchResultPages([
      "docs/02-hidden/page.mdx",
      "docs/03-disabled/page.mdx",
      "docs/01-guide/page.mdx",
    ]),
  ).toEqual([pages[0], pages[1]]);
  expect(routing.searchResultPage("docs/02-hidden/page.mdx")).toBe(pages[0]);
  expect(routing.searchResultRoute("docs/03-disabled/page.mdx")).toBeNull();
  expect(createContentRouting([]).firstContentRoute()).toBeNull();
});
