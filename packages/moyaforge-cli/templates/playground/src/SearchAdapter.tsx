import { routes } from "virtual:moyaforge-mdx/metadata";

/** Search the generated site's page titles and descriptions. */
export async function SearchAdapter(query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return routes
    .filter((page) => {
      if (page.navigation !== "visible") return false;
      const text = [page.title, page.description, page.path]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => text.includes(term));
    })
    .map((page) => ({
      path: page.path,
      label: page.title,
      source: page.source,
      sourcePath: page.sourcePath,
    }));
}
