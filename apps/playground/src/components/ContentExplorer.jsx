import { lazy, Suspense, useMemo, useState } from "react";
import { pages, navigation, headings } from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";
import { DocOutline } from "@moyarich/moyaforge";

/**
 * Demonstrates the framework-neutral metadata + lazy component contract.
 * No page module is imported until its navigation entry is selected.
 */
export function ContentExplorer() {
  const visible = navigation.filter((page) => sources[page.source]?.lazyPages?.[page.file]);
  const [selectedPath, setSelectedPath] = useState(() => visible[0]?.path ?? "");
  const selected = pages.find((page) => page.path === selectedPath && page.navigation !== "disabled");
  const loader = selected && sources[selected.source]?.lazyPages?.[selected.file];
  const Page = useMemo(() => (loader ? lazy(loader) : null), [loader]);
  const toc = selected ? headings[`${selected.source}/${selected.file}`] ?? [] : [];

  if (!visible.length) {
    return <p>No registered content pages were found.</p>;
  }
  return (
    <div className="content-explorer">
      <nav aria-label="Registered content pages">
        <h2>Registered pages</h2>
        <ul>
          {visible.map((page) => (
            <li key={page.path}>
              <button
                type="button"
                aria-current={page.path === selectedPath ? "page" : undefined}
                onClick={() => setSelectedPath(page.path)}
              >
                {page.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <section aria-label="Registered content preview">
        {selected && Page ? (
          <>
            <h2>{selected.title}</h2>
            {selected.description && <p>{selected.description}</p>}
            <Suspense fallback={<p role="status">Loading page…</p>}>
              <Page key={selected.path} />
            </Suspense>
            {selected.toc !== false && toc.length > 0 && (
              <DocOutline headings={toc} title="On this page" />
            )}
          </>
        ) : <p>Choose a page.</p>}
      </section>
    </div>
  );
}
