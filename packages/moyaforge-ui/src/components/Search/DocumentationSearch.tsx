import "./DocumentationSearch.css";
import { isKeyHotkey } from "is-hotkey";
import { useEffect, useRef, useState } from "react";

export interface DocumentationSearchResult {
  path: string;
  label: string;
}

export interface DocumentationSearchProps {
  search: (query: string) => Promise<readonly DocumentationSearchResult[]>;
  onNavigate?: (path: string) => void;
  hotkey?: string | readonly string[];
  kbd?: string;
  resultsPosition?: "overlay" | "inline";
}

export function DocumentationSearch({
  search,
  onNavigate,
  hotkey,
  kbd,
  resultsPosition = "overlay",
}: DocumentationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly DocumentationSearchResult[]>(
    [],
  );
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hotkey) return;
    const matchesShortcut = isKeyHotkey(hotkey);
    const handler = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        !matchesShortcut(event)
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey]);

  useEffect(() => {
    setResults([]);
    setMessage("");
    if (!query.trim()) return;

    let active = true;
    setMessage("Searching…");
    search(query)
      .then((matches) => {
        if (!active) return;
        setResults(matches);
        setMessage(matches.length ? "" : "No matching pages");
      })
      .catch(() => {
        if (active) setMessage("Search is unavailable. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [query, search]);

  return (
    <div className="mf-search" data-results-position={resultsPosition}>
      <label>
        <span aria-hidden="true">⌕</span>
        <input
          ref={input}
          aria-label="Search documentation"
          placeholder="Search documentation…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              event.currentTarget.blur();
            }
          }}
        />
        {kbd && <kbd>{kbd}</kbd>}
      </label>
      {query.trim() && (
        <div className="mf-results" aria-live="polite">
          {message ||
            results.map((result) => (
              <div key={result.path}>
                <a
                  href={result.path}
                  onClick={(event) => {
                    if (
                      onNavigate &&
                      event.button === 0 &&
                      !event.metaKey &&
                      !event.ctrlKey &&
                      !event.shiftKey &&
                      !event.altKey
                    ) {
                      event.preventDefault();
                      setQuery("");
                      onNavigate(result.path);
                    }
                  }}
                >
                  {result.label}
                </a>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
