import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createFrontmatterDemo } from "../../apps/playground/src/components/PreviewMdx/frontmatter/frontmatter-demo.js";
import { extractPageHeadings } from "../../packages/moyaforge-mdx/src/content/headings.js";
import { createVirtualRegistry } from "../../apps/playground/src/components/PreviewMdx/virtual-registry.js";
import { PreviewInteractive } from "../../packages/moyaforge-ui/src/components/PreviewInteractive/index.js";

test("virtual registries support multiple sources and source-relative documents", () => {
  const { registry, files } = createVirtualRegistry({
    handbook: {
      "page.md": "---\ntitle: Handbook\n---\n",
      "01-setup/page.mdx": "---\ntitle: Quick setup\n---\n",
    },
    api: { "page.md": "# API" },
  });
  expect([...registry.byPath.keys()]).toEqual(
    expect.arrayContaining(["/handbook", "/handbook/quick-setup", "/api"]),
  );
  expect(files["handbook/01-setup/page.mdx"]).toContain("title: Quick setup");
  expect(registry.byPath.get("/handbook/quick-setup")?.parentPath).toBe(
    "/handbook",
  );
});

test("virtual frontmatter handles CRLF and validates metadata", () => {
  const { registry } = createVirtualRegistry({
    guide: { "page.md": "\uFEFF---\r\ntitle: Guide\r\ntoc: false\r\n---\r\n" },
  });
  expect(registry.pages[0].toc).toBe(false);
  expect(() =>
    createVirtualRegistry({
      guide: { "page.md": "---\ntitle: [invalid]\n---\n" },
    }),
  ).toThrow("guide/page.md: title must be a string");
  expect(() =>
    createVirtualRegistry({ guide: { "page.md": "---\ntitle: Unclosed" } }),
  ).toThrow("guide/page.md: unterminated frontmatter");
});

test("metadata shares resizable configuration with controls and stays outside the rendered preview", () => {
  const markup = renderToStaticMarkup(
    createElement(PreviewInteractive, {
      title: "Reusable demo",
      files: { "example.ts": "const value = 1;" },
      controls: createElement("input", { "aria-label": "Setting" }),
      metadata: createElement("p", null, "Derived data"),
      children: createElement("p", null, "Rendered UI"),
    }),
  );
  expect(markup).toContain('aria-label="Resize preview controls"');
  expect(markup).toContain('aria-label="Reusable demo metadata"');
  const result = markup
    .split('aria-label="Reusable demo result"')[1]
    .split('aria-label="Reusable demo source"')[0];
  expect(result).toContain("Rendered UI");
  expect(result).not.toContain("Derived data");
});

test("virtual pages render their Markdown body rather than frontmatter or placeholder content", async () => {
  const { compileVirtualPage } =
    await import("../../apps/playground/src/components/PreviewMdx/compile-virtual-page.js");
  const { default: Content } = await compileVirtualPage(
    "---\ntitle: Metadata name\n---\n\n# Actual article\n\nA **working** example.\n\n- First step\n- Second step\n",
    "guide/page.md",
    "preview-",
  );
  const markup = renderToStaticMarkup(createElement(Content));
  expect(markup).toContain(
    '<h1 id="preview-actual-article">Actual article</h1>',
  );
  expect(markup).toContain("<strong>working</strong>");
  expect(markup).toContain("<li>Second step</li>");
  expect(markup).not.toContain("Metadata name");
});

test("virtual MDX bodies can render supplied React components", async () => {
  const { compileVirtualPage } =
    await import("../../apps/playground/src/components/PreviewMdx/compile-virtual-page.js");
  const { default: Content } = await compileVirtualPage(
    "# MDX article\n\n<Notice />",
    "page.mdx",
    "mdx-",
  );
  const markup = renderToStaticMarkup(
    createElement(Content, {
      components: {
        Notice: () => createElement("aside", null, "Rendered component"),
      },
    }),
  );
  expect(markup).toContain("<aside>Rendered component</aside>");
});

test("interactive frontmatter previews preserve the authored example bodies", async () => {
  const { files, registry } = createFrontmatterDemo({
    page: { title: "Custom setup", navigation: "hidden" },
  });
  for (const [filename, source] of Object.entries(files)) {
    const authored = readFileSync(
      new URL(
        `../../apps/playground/src/components/PreviewMdx/frontmatter/examples/${filename}`,
        import.meta.url,
      ),
      "utf8",
    );
    const body = (value: string) =>
      value.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
    expect(body(source)).toBe(body(authored));
    expect(await extractPageHeadings(source, filename)).toEqual(
      await extractPageHeadings(authored, filename),
    );
  }
  expect(registry.byPath.get("/docs/custom-setup")?.navigation).toBe("hidden");
});
