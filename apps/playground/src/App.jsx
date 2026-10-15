import { useEffect, useState } from "react";
import { ContentExplorer } from "./components/ContentExplorer.jsx";
import {
  readContentRoute,
  searchResultPage,
  contentHref,
  navigateContent,
} from "./content-routing.js";
import { searchPages } from "./search/search-client.js";

/**
 * Private app shell only. Docs and examples are owned by the repository's
 * docs/ tree and rendered through the registered MDX content inventory.
 */
export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const update = () => {
      const id = ++requestId;
      searchPages(searchQuery)
        .then((results) => {
          if (active && id === requestId) {
            setSearchResults(results);
            setSearchError("");
          }
        })
        .catch((error) => {
          if (active && id === requestId) setSearchError(String(error));
        });
    };
    update();
    window.addEventListener("moyaforge-search:updated", update);
    return () => {
      active = false;
      requestId++;
      window.removeEventListener("moyaforge-search:updated", update);
    };
  }, [searchQuery]);

  return (
    <div className="playground">
      <header className="topbar">
        <a
          className="brand"
          href="#main"
          aria-label="MoyaForge documentation home"
        >
          <span className="brand-mark">M</span> MoyaForge{" "}
          <span className="brand-subtitle">/ Documentation</span>
        </a>
        <a
          href="https://github.com/moyarich/moyaforge"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub ↗
        </a>
      </header>
      <div className="layout">
        <aside className="sidebar" aria-label="Documentation search">
          <div className="sidebar-label">DOCUMENTATION SEARCH</div>
          <label htmlFor="playground-search">Search registered pages</label>
          <input
            id="playground-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search docs and packages"
            aria-controls="playground-search-results"
          />
          <div id="playground-search-results" aria-live="polite">
            {searchError && <p role="alert">{searchError}</p>}
            {searchQuery.trim() &&
              !searchError &&
              searchResults.length === 0 && <p>No matching pages found.</p>}
            {searchQuery.trim() && !searchError && searchResults.length > 0 && (
              <ul>
                {searchResults.map((key) => {
                  const page = searchResultPage(key);
                  const path = page?.path;
                  return (
                    <li key={key}>
                      {path ? (
                        <a
                          href={contentHref(path)}
                          onClick={(event) => {
                            if (
                              event.button !== 0 ||
                              event.metaKey ||
                              event.ctrlKey ||
                              event.shiftKey ||
                              event.altKey
                            )
                              return;
                            event.preventDefault();
                            navigateContent(path);
                          }}
                        >
                          {page.title || page.label || path}
                        </a>
                      ) : (
                        <code>{key}</code>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="sidebar-note">
            Documentation and examples come from the repository's docs
            directory.
          </p>
        </aside>
        <main id="main" className="main" tabIndex={-1}>
          <p className="eyebrow">REPOSITORY DOCUMENTATION</p>
          <h1>MoyaForge Docs</h1>
          <p className="intro">
            Guides and examples maintained in the repository.
          </p>
          <div className="panel">
            <ContentExplorer />
          </div>
        </main>
      </div>
    </div>
  );
}
