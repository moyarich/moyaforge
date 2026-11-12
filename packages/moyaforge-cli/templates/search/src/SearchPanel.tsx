import { useNavigate } from "react-router-dom";
import { DocumentationSearch } from "__UI__/Search/index.js";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";
import { resolveSearchPages } from "./Routing.js";

async function findMatchingPages(query: string) {
  return resolveSearchPages(await searchPages(query));
}

export function SearchPanel() {
  const navigate = useNavigate();
  return (
    <DocumentationSearch
      search={findMatchingPages}
      onNavigate={navigate}
      resultsPosition="inline"
    />
  );
}
