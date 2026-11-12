import { useNavigate } from "react-router-dom";
import { createContentRouting } from "@moyarich/moyaforge/headless";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";
import { routes } from "virtual:moyaforge-mdx/metadata";
import { DocumentationSearch } from "../../../../src/components/Search/index.js";

const contentRouting = createContentRouting(routes);

async function search(query: string) {
  return contentRouting.searchResultPages(await searchPages(query)).slice(0, 5);
}

export default function Example() {
  const navigate = useNavigate();

  return (
    <DocumentationSearch
      search={search}
      onNavigate={navigate}
      resultsPosition="inline"
      hotkey="alt+shift+s"
      kbd="Alt Shift S"
    />
  );
}
