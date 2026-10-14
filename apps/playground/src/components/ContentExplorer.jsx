import { lazy, Suspense, useMemo, useState, useEffect } from "react";
import {
  pages,
  routes,
  navigation,
  headings,
} from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";
import { DocOutline } from "@moyarich/moyaforge";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import {
  readContentRoute,
  contentHref,
  navigateContent,
  firstContentRoute,
} from "../content-routing.js";

export function ContentExplorer() {
  const visible = navigation.filter(
    (page) => sources[page.source]?.lazyPages?.[page.file],
  );
  const [selectedPath, setSelectedPath] = useState(
    () => readContentRoute() ?? firstContentRoute(),
  );
  useEffect(() => {
    const update = () =>
      setSelectedPath(readContentRoute() ?? firstContentRoute());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const selected = pages.find(
    (page) => page.path === selectedPath && page.navigation !== "disabled",
  );
  const loader =
    selected && sources[selected.source]?.lazyPages?.[selected.file];
  const Page = useMemo(() => (loader ? lazy(loader) : null), [loader]);
  const toc = selected
    ? getTableOfContents(
        headings[`${selected.source}/${selected.file}`] ?? [],
        selected.toc,
      )
    : null;

  if (!routes.some((page) => sources[page.source]?.lazyPages?.[page.file]))
    return <p>No registered content pages were found.</p>;
  return (
    <div className="content-explorer">
      <nav aria-label="Registered content pages">
        <h2>Registered pages</h2>
        <ul>
          {visible.map((page) => (
            <li key={page.path}>
              <a
                href={contentHref(page.path)}
                aria-current={page.path === selectedPath ? "page" : undefined}
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
                  navigateContent(page.path);
                }}
              >
                {page.label}
              </a>
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
            {toc && toc.options.placement !== "none" && (
              <DocOutline
                headings={toc.headings}
                title={toc.options.label}
                collapsible={toc.options.collapsible}
                defaultOpen={toc.options.defaultOpen}
              />
            )}
          </>
        ) : (
          <p>Choose a registered page.</p>
        )}
      </section>
    </div>
  );
}
