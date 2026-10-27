import { describe, expect, it } from "vitest";
import { buildPageRegistry } from "../src/registry/registry.js";
import { createContentManifest } from "../src/content/manifest.js";
import { createStaticPublication } from "../src/content/static-publication.js";

describe("static publication", () => {
  it("uses canonical routes and headings with deterministic visibility filtering", () => {
    const registry = buildPageRegistry({
      docs: [
        { file: "02-hidden/page.mdx", frontmatter: { title: "Hidden", navigation: "hidden" } },
        { file: "01-guide/page.mdx", frontmatter: { title: "Guide", description: "Getting started" } },
        { file: "03-disabled/page.mdx", frontmatter: { title: "Disabled", navigation: "disabled" } },
      ],
    });
    const manifest = createContentManifest({
      registry,
      headings: { "docs/01-guide/page.mdx": [{ id: "install", value: "Install", depth: 2 }] },
    });
    const options = { origin: "https://example.com/project", title: "Reference" };
    const output = createStaticPublication(manifest, options);
    expect(output).toEqual(createStaticPublication([...manifest].reverse(), options));
    expect(output.metadata.map((page) => page.path)).toEqual(["/docs/guide"]);
    expect(output.searchIndex[0]).toMatchObject({
      url: "https://example.com/project/docs/guide",
      headings: [{ id: "install", label: "Install", depth: 2 }],
    });
    expect(output.llmsTxt).toBe(
      "# Reference\n\n- [Guide](https://example.com/project/docs/guide): Getting started\n",
    );
    expect(createStaticPublication(manifest, { ...options, includeHidden: true })
      .metadata.map((page) => page.path)).toEqual(["/docs/guide", "/docs/hidden"]);
    expect(() => createStaticPublication(manifest, { origin: "file:///tmp/site" }))
      .toThrow(/HTTP\(S\)/);
  });
});
