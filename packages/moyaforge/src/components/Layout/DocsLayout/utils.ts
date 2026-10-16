import type { MouseEvent } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";
import { buildNavigationTree } from "@moyarich/moyaforge-mdx/navigation";
import type { DocHeading } from "../../DocOutline/DocOutline.js";

export type DocumentationSources = Readonly<
  Record<string, { navigation?: { label?: string; order?: number } }>
>;

export function filterDepth(
  headings: readonly DocHeading[],
  min: number,
  max: number,
): DocHeading[] {
  return headings.flatMap((heading) => {
    const children = filterDepth(heading.children ?? [], min, max);
    if (heading.depth < min) return children;
    if (heading.depth > max) return [];
    return [{ ...heading, children }];
  });
}

export function buildDocumentationGroups(
  routes: readonly NormalizedPage[],
  sources: DocumentationSources,
) {
  const sourceNames = [...new Set(routes.map((item) => item.source))].sort(
    (a, b) =>
      (sources[a]?.navigation?.order ?? 0) -
        (sources[b]?.navigation?.order ?? 0) || a.localeCompare(b),
  );
  const groups = sourceNames.map((source) => ({
    source,
    label: sources[source]?.navigation?.label ?? source,
    nodes: buildNavigationTree(
      routes.filter((item) => item.source === source),
    ).flatMap((node) =>
      node.path === `/${source}`
        ? node.page
          ? [node]
          : node.children
        : [node],
    ),
  }));
  return groups;
}

export type DocumentationGroup = ReturnType<
  typeof buildDocumentationGroups
>[number];
export function createContentLinkHandler({
  routes,
  page,
  pathname,
  navigateContent,
}: {
  routes: readonly NormalizedPage[];
  page: NormalizedPage | null;
  pathname: string;
  navigateContent: NavigateFunction;
}) {
  return (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href || anchor?.target || anchor?.hasAttribute("download")) return;
    if (href.startsWith("#") && !href.startsWith("#/")) {
      event.preventDefault();
      navigateContent({ pathname: pathname, hash: href });
      document
        .getElementById(decodeURIComponent(href.slice(1)))
        ?.scrollIntoView();
      return;
    }
    if (!page || /^(?:[a-z]+:|\/\/|#)/i.test(href)) return;
    const resolved = new URL(
      href,
      `https://content.local/${page.source}/${page.file}`,
    );
    const key = decodeURIComponent(resolved.pathname.slice(1)).replace(
      /\/$/,
      "",
    );
    const target =
      routes.find((item) => {
        const itemKey = `${item.source}/${item.file}`;
        return (
          itemKey === key ||
          itemKey === `${key}/page.mdx` ||
          itemKey === `${key}.md`
        );
      }) ?? routes.find((item) => item.path === resolved.pathname);
    if (target) {
      event.preventDefault();
      navigateContent({ pathname: target.path, hash: resolved.hash });
    }
  };
}
