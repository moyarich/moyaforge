import { PreviewSidebarGroup } from "../sidebar-group/PreviewSidebarGroup.js";
import { VirtualPage } from "../../VirtualPage.js";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import type {
  TocOptions,
  TocSetting,
} from "../../../../../../../packages/moyaforge-mdx/src/registry/index.js";
import {
  getTableOfContents,
  type TocHeading,
} from "../../../../../../../packages/moyaforge-mdx/src/navigation/toc/index.js";
import {
  TableOfContents,
  type TableOfContentsItem,
} from "../../../../../../../packages/moyaforge-ui/src/components/TableOfContents/index.js";
import { PreviewInteractive } from "../../../../../../../packages/moyaforge-ui/src/components/PreviewInteractive/index.js";
import { createFrontmatterDemo } from "../frontmatter-demo.js";
import { extractPageHeadings } from "../../../../../../../packages/moyaforge-mdx/src/content/headings.js";

function prefixHeadings(headings: TocHeading[], prefix: string): TocHeading[] {
  return headings.map((heading) => ({
    ...heading,
    id: `${prefix}-${heading.id}`,
    children: prefixHeadings(heading.children ?? [], prefix),
  }));
}

function flattenHeadings(
  headings: readonly TocHeading[],
): TableOfContentsItem[] {
  return headings.flatMap((heading) => [
    { id: heading.id, label: heading.value, level: heading.depth },
    ...flattenHeadings(heading.children ?? []),
  ]);
}

export default function PreviewOutline() {
  const prefix = useId();
  const article = useRef<HTMLDivElement>(null);
  const [currentPath, setCurrentPath] = useState("/docs/installation");
  const [mode, setMode] = useState("custom");
  const [options, setOptions] = useState<Required<TocOptions>>({
    placement: "right",
    label: "On this page",
    minDepth: 2,
    maxDepth: 3,
    collapsible: true,
    defaultOpen: true,
  });
  const [activeId, setActiveId] = useState("");
  const toc: TocSetting | undefined =
    mode === "inherit"
      ? undefined
      : mode === "custom"
        ? options
        : mode === "enabled";
  const { files, registry } = createFrontmatterDemo({ page: { toc } });
  const page = registry.byPath.get(currentPath)!;
  const filename = `${page.source}/${page.file}`;
  const source = files[filename];
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  useEffect(() => {
    let active = true;
    setHeadings([]);
    void extractPageHeadings(source, filename).then((result) => {
      if (active) setHeadings(prefixHeadings(result, prefix));
    });
    return () => {
      active = false;
    };
  }, [source, filename, prefix]);
  const resolved = getTableOfContents(headings, page.toc);
  const placement = resolved.options.placement;

  function navigateToPage(path: string) {
    setCurrentPath(path);
    setActiveId("");
    article.current?.scrollTo({ top: 0 });
  }

  function updateMode(event: ChangeEvent<HTMLSelectElement>) {
    setMode(event.currentTarget.value);
  }
  function updateOptions(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.currentTarget;
    if (name === "collapsible" || name === "defaultOpen") {
      const checked = (event.currentTarget as HTMLInputElement).checked;
      setOptions((previous) => ({ ...previous, [name]: checked }));
    } else if (name === "minDepth" || name === "maxDepth") {
      const depth = Number(value);
      setOptions((previous) => ({
        ...previous,
        [name]: depth,
        ...(name === "minDepth"
          ? { maxDepth: Math.max(depth, previous.maxDepth) }
          : { minDepth: Math.min(depth, previous.minDepth) }),
      }));
    } else setOptions((previous) => ({ ...previous, [name]: value }));
  }
  function navigateToHeading(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const id = event.currentTarget.dataset.headingId;
    const root = article.current;
    const heading = id ? document.getElementById(id) : null;
    if (!root || !heading || !id) return;
    setActiveId(id);
    root.scrollTo({
      top:
        root.scrollTop +
        heading.getBoundingClientRect().top -
        root.getBoundingClientRect().top -
        12,
      behavior: "auto",
    });
  }
  function renderLink(item: TableOfContentsItem) {
    return (
      <a
        href={`#${item.id}`}
        data-heading-id={item.id}
        onClick={navigateToHeading}
        aria-current={activeId === item.id ? "location" : undefined}
      >
        {item.label}
      </a>
    );
  }
  const links = (
    <TableOfContents
      items={flattenHeadings(resolved.headings)}
      renderLink={renderLink}
    />
  );
  const outline =
    placement === "none" ? null : resolved.options.collapsible ? (
      <details
        key={JSON.stringify(resolved.options)}
        open={resolved.options.defaultOpen}
      >
        <summary>{resolved.options.label}</summary>
        {links}
      </details>
    ) : (
      <div>
        <strong>{resolved.options.label}</strong>
        {links}
      </div>
    );

  return (
    <PreviewInteractive
      className="frontmatter-demo"
      title="Outline from frontmatter"
      description="Controls configure Installation. Use the sidebar to view each virtual page and its own outline settings."
      files={files}
      primaryFile={filename}
      previewDescription="Rendered article and outline"
      sourceDescription="Example source files"
      metadata={
        <div className="frontmatter-metadata">
          <dl>
            <dt>Placement</dt>
            <dd>{placement}</dd>
            <dt>Label</dt>
            <dd>{resolved.options.label}</dd>
            <dt>Heading depths</dt>
            <dd>
              {resolved.options.minDepth}–{resolved.options.maxDepth}
            </dd>
            <dt>Collapsible</dt>
            <dd>{resolved.options.collapsible ? "Yes" : "No"}</dd>
            <dt>Initially open</dt>
            <dd>{resolved.options.defaultOpen ? "Yes" : "No"}</dd>
          </dl>
        </div>
      }
      controls={
        <>
          <div className="frontmatter-fields">
            <label>
              TOC setting
              <select value={mode} onChange={updateMode}>
                <option value="custom">Options object</option>
                <option value="inherit">Omitted — registry default</option>
                <option value="enabled">true — built-in defaults</option>
                <option value="disabled">false — no outline</option>
              </select>
            </label>
          </div>
          <fieldset
            className="frontmatter-fields frontmatter-toc-options"
            disabled={mode !== "custom"}
          >
            <legend>Outline options</legend>
            <label>
              Placement
              <select
                name="placement"
                value={options.placement}
                onChange={updateOptions}
              >
                <option>right</option>
                <option>sidebar</option>
                <option>inline</option>
                <option>none</option>
              </select>
            </label>
            <label>
              Label
              <input
                name="label"
                value={options.label}
                onChange={updateOptions}
              />
            </label>
            <label>
              Minimum depth
              <select
                name="minDepth"
                value={options.minDepth}
                onChange={updateOptions}
              >
                {[1, 2, 3, 4, 5, 6].map((depth) => (
                  <option key={depth}>{depth}</option>
                ))}
              </select>
            </label>
            <label>
              Maximum depth
              <select
                name="maxDepth"
                value={options.maxDepth}
                onChange={updateOptions}
              >
                {[1, 2, 3, 4, 5, 6].map((depth) => (
                  <option key={depth}>{depth}</option>
                ))}
              </select>
            </label>
            <label className="frontmatter-check">
              <input
                type="checkbox"
                name="collapsible"
                checked={options.collapsible}
                onChange={updateOptions}
              />
              Collapsible
            </label>
            <label className="frontmatter-check">
              <input
                type="checkbox"
                name="defaultOpen"
                checked={options.defaultOpen}
                onChange={updateOptions}
                disabled={!options.collapsible}
              />
              Start expanded
            </label>
          </fieldset>
        </>
      }
    >
      {placement === "none" && (
        <p className="frontmatter-caption" role="status">
          {mode === "disabled" ||
          (mode === "custom" && options.placement === "none")
            ? "Outline disabled."
            : "No headings match the selected depths."}
        </p>
      )}
      <div className={`frontmatter-outline-layout is-${placement}`}>
        <aside className="frontmatter-outline-navigation">
          <PreviewSidebarGroup
            registry={registry}
            currentPath={page.path}
            onNavigate={navigateToPage}
            outline={placement === "sidebar" ? outline : null}
          />
        </aside>
        <div
          ref={article}
          className="frontmatter-outline-article"
          role="region"
          aria-label="Virtual page article"
          tabIndex={0}
        >
          {placement === "inline" && outline}
          <VirtualPage
            filename={filename}
            source={files[filename]}
            headingPrefix={`${prefix}-`}
          />
        </div>
        {placement === "right" && (
          <aside className="frontmatter-outline-rail">{outline}</aside>
        )}
      </div>
    </PreviewInteractive>
  );
}
