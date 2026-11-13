import { createContentRouting } from "@moyarich/moyaforge/headless";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";
import { routes } from "virtual:moyaforge-mdx/metadata";

const contentRouting = createContentRouting(routes);
export async function SearchAdapter(query: string) {
  return contentRouting.searchResultPages(await searchPages(query));
}
