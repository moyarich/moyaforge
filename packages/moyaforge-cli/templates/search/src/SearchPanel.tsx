import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "__UI__/Search/Search.js";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";
import { routes } from "virtual:moyaforge-mdx/metadata";

export function SearchPanel() {
  const [results, setResults] = useState<string[]>([]);
  return <div>
    <Search inputProps={{ "aria-label": "Search documentation" }}
      onChange={async event => setResults(await searchPages(event.currentTarget.value))} />
    <div className="mf-results">{results.map((result, index) => {
      const page = routes.find(page => page.title === result || page.path === result);
      return <Link key={index} to={page?.path ?? "/docs"}>{result}</Link>;
    })}</div>
  </div>;
}
