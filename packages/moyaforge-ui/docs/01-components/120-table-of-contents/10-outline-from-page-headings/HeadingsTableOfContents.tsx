import "./HeadingsTableOfContents.css";
import {
  useId,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import {
  TableOfContents,
  type TableOfContentsItem,
} from "../../../../src/components/TableOfContents/TableOfContents.js";

const sections = [
  {
    id: "quickstart",
    label: "Quickstart",
    level: 2,
    text: "Build a documentation site with a small set of Markdown pages. Keep content alongside your application and let the registry resolve page titles, routes, and navigation.",
  },
  {
    id: "installation",
    label: "Installation",
    level: 3,
    text: "Install the CLI in your project, then initialize a documentation template. The generated project includes routing, a content registry, and a Markdown provider you can customize.",
  },
  {
    id: "configuration",
    label: "Configuration",
    level: 3,
    text: "Choose your content directories and register each source. Use frontmatter titles to name your pages and numeric filename prefixes to control their order in navigation.",
  },
  {
    id: "authoring",
    label: "Authoring pages",
    level: 2,
    text: "Write headings that describe the reader’s next task. Second-level headings form the main outline; third-level headings add detail without breaking the flow of the page.",
  },
  {
    id: "examples",
    label: "Adding examples",
    level: 3,
    text: "Place an interactive example beside its source so readers can see both the result and the code. Include any required styles and explain the behavior the example demonstrates.",
  },
  {
    id: "publishing",
    label: "Publishing",
    level: 2,
    text: "Build the site and check its internal links before publishing. Review the output at narrow and wide widths, and confirm the navigation remains usable with a keyboard.",
  },
];

export default function HeadingsTableOfContents() {
  const prefix = useId();
  const content = useRef<HTMLDivElement>(null);
  const clickedHeading = useRef<string | null>(null);
  const items: TableOfContentsItem[] = sections.map((section) => ({
    id: `${prefix}-${section.id}`,
    label: section.label,
    level: section.level,
  }));
  const [activeId, setActiveId] = useState(items[0].id);

  function updateActiveHeading() {
    const root = content.current;
    if (!root || clickedHeading.current) return;
    const top = root.getBoundingClientRect().top + 40;
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    );
    const active = headings
      .filter((heading) => heading.getBoundingClientRect().top <= top)
      .at(-1);
    setActiveId(active?.id ?? items[0].id);
  }

  function releaseClickedHeading() {
    clickedHeading.current = null;
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    ) {
      releaseClickedHeading();
    }
  }

  function handleHeadingClick(event: MouseEvent<HTMLAnchorElement>) {
    const headingId = event.currentTarget.dataset.headingId;
    if (!headingId) return;
    event.preventDefault();
    const root = content.current;
    const heading = document.getElementById(headingId);
    if (!root || !heading) return;
    const top = Math.max(
      0,
      Math.min(
        root.scrollTop +
          heading.getBoundingClientRect().top -
          root.getBoundingClientRect().top -
          24,
        root.scrollHeight - root.clientHeight,
      ),
    );
    // Keep a clicked destination selected while passing other headings.
    setActiveId(headingId);
    clickedHeading.current =
      Math.abs(root.scrollTop - top) > 1 ? headingId : null;
    root.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function renderLink(item: TableOfContentsItem) {
    return (
      <a
        href={`#${item.id}`}
        data-heading-id={item.id}
        aria-current={activeId === item.id ? "location" : undefined}
        onClick={handleHeadingClick}
      >
        {item.label}
      </a>
    );
  }

  function renderSection(section: (typeof sections)[number], index: number) {
    const Heading = section.level === 2 ? "h2" : "h3";
    return (
      <section key={section.id}>
        <Heading id={items[index].id}>{section.label}</Heading>
        <p>{section.text}</p>
      </section>
    );
  }

  return (
    <div className="toc-example">
      <aside className="toc-example-outline">
        <p className="toc-example-label">On this page</p>
        <TableOfContents items={items} renderLink={renderLink} />
        <p className="toc-example-hint">
          Select a heading or scroll the article.
        </p>
      </aside>
      <div
        ref={content}
        className="toc-example-content"
        role="region"
        aria-label="Example article"
        tabIndex={0}
        onScroll={updateActiveHeading}
        onScrollEnd={releaseClickedHeading}
        onWheel={releaseClickedHeading}
        onTouchStart={releaseClickedHeading}
        onPointerDown={releaseClickedHeading}
        onKeyDown={handleContentKeyDown}
      >
        {sections.map(renderSection)}
      </div>
    </div>
  );
}
