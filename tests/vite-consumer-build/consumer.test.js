import { describe, expect, it } from "vitest";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";

describe("independent Vite consumer", () => {
  it("uses shared compiler and heading metadata", () => {
    const options = createMdxOptions();
    expect(options).toBeDefined();
    const toc = getTableOfContents([{ id: "overview", value: "Overview", depth: 2 }]);
    expect(toc.headings[0].id).toBe("overview");
  });

  it("composes canonical registry and SQLite plugins", () => {
    const registry = { sources: { docs: { base: "docs", include: ["**/page.mdx"] } } };
    expect(mdxRegistryPlugin({ registry, root: process.cwd() })).toBeDefined();
    expect(sqliteSearchPlugin({ registry, root: process.cwd() }).name).toBe(
      "moyaforge-search-sqlite:sqlite-search",
    );
  });
});
