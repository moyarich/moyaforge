import { useEffect, useState } from "react";
import { ContentExplorer } from "./components/ContentExplorer.jsx";
import {
  readContentRoute,
  searchResultPage,
  contentHref,
  navigateContent,
} from "./content-routing.js";
import { searchPages } from "./search/search-client.js";
import {
  CodeGroup,
  CodeTab,
  CopyButton,
  Demo as ForgeDemo,
  EmptyState,
  createMdxComponents,
  moyaForgeComponents,
} from "@moyarich/moyaforge";
import { ConsoleValue } from "@moyarich/console";
import { Demo, PlaygroundCallout } from "./components/index.js";

const examples = [
  {
    name: "Content registry",
    description: "Discover workspace documentation and load pages on demand.",
  },
  {
    name: "Documentation",
    description: "Accessible code tabs, copy actions and MDX defaults.",
  },
  {
    name: "Consumer overrides",
    description: "Replace framework defaults without editing the library.",
  },
  {
    name: "Console",
    description:
      "Inspect structured values using the published Console package.",
  },
];

const components = createMdxComponents(moyaForgeComponents, {
  Demo,
  Callout: PlaygroundCallout,
});

export function App() {
  const [section, setSection] = useState(() =>
    readContentRoute() ? "Content registry" : "Documentation",
  );
  const [override, setOverride] = useState(true);
  useEffect(() => {
    const onHistory = () => {
      if (readContentRoute()) setSection("Content registry");
    };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  useEffect(() => {
    let active = true;
    let requestId = 0;
    const update = () => {
      const currentRequest = ++requestId;
      searchPages(searchQuery)
        .then((results) => {
          if (active && currentRequest === requestId) {
            setSearchResults(results);
            setSearchError("");
          }
        })
        .catch((error) => {
          if (active && currentRequest === requestId)
            setSearchError(String(error));
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
          aria-label="MoyaForge playground home"
        >
          <span className="brand-mark">M</span> MoyaForge{" "}
          <span className="brand-subtitle">/ Playground</span>
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
        <aside className="sidebar" aria-label="Example navigation">
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
            {searchQuery.trim() && !searchError && (
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
                            setSection("Content registry");
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
          <div className="sidebar-label">COMPONENT EXAMPLES</div>
          <nav aria-label="Playground sections">
            {examples.map(({ name, description }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSection(name)}
                aria-current={section === name ? "page" : undefined}
                className={section === name ? "nav-item selected" : "nav-item"}
              >
                <strong>{name}</strong>
                <small>{description}</small>
              </button>
            ))}
          </nav>
          <p className="sidebar-note">
            These examples run in the private workspace app and use MoyaForge's
            public component exports.
          </p>
        </aside>
        <main id="main" className="main" tabIndex={-1}>
          <p className="eyebrow">INTERACTIVE SHOWCASE</p>
          <h1>{section}</h1>
          <p className="intro">
            {examples.find((item) => item.name === section)?.description}
          </p>
          {section === "Content registry" && (
            <div className="panel">
              <ContentExplorer />
            </div>
          )}
          {section === "Documentation" && (
            <div className="panel">
              <h2>Install packages</h2>
              <p>Switch package managers with keyboard-accessible tabs.</p>
              <CodeGroup label="Package manager">
                <CodeTab label="npm">
                  <pre>
                    <code>
                      npm install @moyarich/moyaforge @moyarich/console
                    </code>
                  </pre>
                </CodeTab>
                <CodeTab label="pnpm">
                  <pre>
                    <code>pnpm add @moyarich/moyaforge @moyarich/console</code>
                  </pre>
                </CodeTab>
                <CodeTab label="yarn">
                  <pre>
                    <code>yarn add @moyarich/moyaforge @moyarich/console</code>
                  </pre>
                </CodeTab>
              </CodeGroup>
              <h2>Built-in components</h2>
              <div className="preview">
                <ForgeDemo>
                  <strong>MoyaForge Demo</strong>
                  <p>Rendered directly from the published component API.</p>
                </ForgeDemo>
              </div>
              <div className="preview">
                <EmptyState
                  title="No results"
                  description="This is the reusable MoyaForge empty state."
                />
              </div>
              <div className="preview">
                <CopyButton value="npm install @moyarich/moyaforge">
                  Copy npm install command
                </CopyButton>
              </div>
            </div>
          )}
          {section === "Consumer overrides" && (
            <div className="panel">
              <h2>Override a component</h2>
              <p>
                MoyaForge supplies defaults; a consuming app can register an
                implementation under the same name.
              </p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(event) => setOverride(event.target.checked)}
                />{" "}
                Use consumer Demo override
              </label>
              <div className="preview">
                {override ? (
                  <components.Demo>
                    Consumer-provided Demo implementation
                  </components.Demo>
                ) : (
                  <ForgeDemo>Built-in MoyaForge Demo implementation</ForgeDemo>
                )}
              </div>
              <div className="preview">
                <components.Callout>
                  Custom Callout registered through createMdxComponents.
                </components.Callout>
              </div>
            </div>
          )}
          {section === "Console" && (
            <div className="panel">
              <h2>Structured value inspection</h2>
              <p>
                This component is imported from the published{" "}
                <code>@moyarich/console</code> package, not copied into
                MoyaForge.
              </p>
              <div className="preview">
                <ConsoleValue
                  value={{
                    framework: "MoyaForge",
                    console: "npm",
                    features: ["MDX", "React", "Documentation"],
                    ready: true,
                  }}
                />
              </div>
            </div>
          )}
          <footer className="footer">
            <span>Built with React, Vite and MoyaForge.</span>
            <a
              href="https://github.com/moyarich/moyaforge/tree/main/docs"
              target="_blank"
              rel="noreferrer"
            >
              Browse docs ↗
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
