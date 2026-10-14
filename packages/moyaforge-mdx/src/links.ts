import { posix } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import type { PageRegistry } from "./registry.js";
import type { TocHeading } from "./toc.js";

export interface LinkIssue {
  file: string;
  href: string;
  reason: "missing-page" | "missing-anchor" | "invalid-link";
}
export interface LinkDocument {
  source: string;
  file: string;
  content: string;
}

function anchors(nodes: readonly TocHeading[]): Set<string> {
  const ids = new Set<string>();
  const visit = (entries: readonly TocHeading[]) => {
    for (const entry of entries) {
      ids.add(entry.id);
      visit(entry.children ?? []);
    }
  };
  visit(nodes);
  return ids;
}

/** Validate authored Markdown links against normalized routable pages and extracted IDs. */
export function validateInternalLinks(
  documents: readonly LinkDocument[],
  registry: PageRegistry,
  headings: Record<string, TocHeading[]>,
): LinkIssue[] {
  const diagnostics: LinkIssue[] = [];
  const bySourceFile = new Map(
    registry.pages.map((page) => [page.source + "/" + page.file, page]),
  );
  for (const document of documents) {
    const key = document.source + "/" + document.file;
    const current = bySourceFile.get(key);
    if (!current) continue;
    const ast = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ["yaml"])
      .use(remarkGfm)
      .use(remarkMdx)
      .parse(document.content);
    const visit = (node: any) => {
      const mdxAnchor =
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        node.name === "a";
      if (node.type === "link" || node.type === "definition" || mdxAnchor) {
        const href = mdxAnchor
          ? node.attributes?.find(
              (attribute: any) =>
                attribute.type === "mdxJsxAttribute" &&
                attribute.name === "href" &&
                typeof attribute.value === "string",
            )?.value
          : (node.url as string);
        if (href && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
          try {
            const [pathPart, hash] = href.split("#", 2);
            const clean = pathPart.split("?")[0];
            if (
              !clean ||
              /(?:^|\/)page\.mdx?$/.test(clean) ||
              !/\.[a-z\d]+$/i.test(clean)
            ) {
              let path = clean
                ? clean.startsWith("/")
                  ? posix.normalize(clean)
                  : posix.resolve(current.path, clean)
                : current.path;
              path =
                path
                  .replace(/\/(?:page\.mdx?|index\.html?)$/, "")
                  .replace(/\/$/, "") || "/";
              const target = registry.byPath.get(path);
              if (!target)
                diagnostics.push({ file: key, href, reason: "missing-page" });
              else if (
                hash &&
                !anchors(headings[target.source + "/" + target.file] ?? []).has(
                  decodeURIComponent(hash),
                )
              )
                diagnostics.push({ file: key, href, reason: "missing-anchor" });
            }
          } catch {
            diagnostics.push({ file: key, href, reason: "invalid-link" });
          }
        }
      }
      if (Array.isArray(node.children))
        for (const child of node.children) visit(child);
    };
    visit(ast);
  }
  return diagnostics;
}
