import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { DocumentationSite } from "../../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.js";

const pages = [
  { path: "/docs", title: "Getting started", source: "docs" },
  { path: "/docs/development", title: "Development", source: "docs" },
  {
    path: "/docs/development/security",
    title: "Preview security",
    source: "docs",
  },
  { path: "/docs/dev", title: "Unrelated prefix", source: "docs" },
];
function breadcrumb(markup: string) {
  return /<nav class="mf-breadcrumb"[^>]*>([\s\S]*?)<\/nav>/.exec(markup)?.[1];
}
test("breadcrumbs display the full titled hierarchy instead of a raw source key", () => {
  const markup = renderToStaticMarkup(
    <DocumentationSite
      title="Docs"
      pages={pages}
      currentPath="/docs/development/security"
    >
      <p>Content</p>
    </DocumentationSite>,
  );
  const result = breadcrumb(markup)!;
  expect(result).toContain('href="/docs"');
  expect(result).toContain('href="/docs/development"');
  expect(result).toContain('aria-current="page">Preview security');
  expect(result.indexOf("Getting started")).toBeLessThan(
    result.indexOf(">Development<"),
  );
  expect(result).not.toContain("Unrelated prefix");
  expect(result).not.toContain(">docs<");
});
test("explicit registry breadcrumbs display hidden current pages", () => {
  const markup = renderToStaticMarkup(
    <DocumentationSite
      title="Docs"
      pages={[pages[0]]}
      currentPath="/docs/private"
      breadcrumbs={[
        { path: "/docs", title: "Getting started" },
        { path: "/docs/private", title: "Private guide" },
      ]}
    >
      <p>Content</p>
    </DocumentationSite>,
  );
  expect(breadcrumb(markup)).toContain('aria-current="page">Private guide');
});
test("unknown routes do not invent a breadcrumb", () => {
  const markup = renderToStaticMarkup(
    <DocumentationSite title="Docs" pages={pages} currentPath="/missing">
      <p>Not found</p>
    </DocumentationSite>,
  );
  expect(breadcrumb(markup)).toBeUndefined();
});

test("registry metadata supplies hidden page breadcrumbs and edit links", () => {
  const markup = renderToStaticMarkup(
    <DocumentationSite
      title="Docs"
      currentPath="/private"
      repository="https://github.com/example/docs/"
      repositoryBranch="docs/update"
      pages={[
        {
          path: "/docs",
          title: "Guide",
          parentPath: null,
          navigation: "visible",
        },
        {
          path: "/private",
          title: "Private guide",
          parentPath: "/docs",
          navigation: "hidden",
          sourcePath: "docs/private guide.mdx",
        },
        { path: "/disabled", title: "Disabled", navigation: "disabled" },
      ]}
    >
      <p>Content</p>
    </DocumentationSite>,
  );
  expect(breadcrumb(markup)).toContain('href="/docs"');
  expect(breadcrumb(markup)).toContain('aria-current="page">Private guide');
  expect(markup).toContain(
    "https://github.com/example/docs/edit/docs%2Fupdate/docs/private%20guide.mdx",
  );
  const navigation =
    /<nav aria-label="Documentation navigation">([\s\S]*?)<\/nav>/.exec(
      markup,
    )![1];
  expect(navigation).not.toContain("Private guide");
  expect(navigation).not.toContain("Disabled");
  expect(markup).not.toContain("Next page");
  expect(markup).not.toContain("Previous page");
});
