import "./CollapsibleOutline.css";
import { useId, useRef, useState, type MouseEvent } from "react";
import { DocOutline } from "../../../../src/components/DocOutline/DocOutline.js";
import type { TableOfContentsItem } from "../../../../src/components/TableOfContents/TableOfContents.js";

const sections = [
  {
    key: "setup",
    title: "Set up your workspace",
    depth: 2,
    text: "Start with a small documentation project. Keep your guides close to the code and preview changes locally before sharing them.",
  },
  {
    key: "install",
    title: "Install dependencies",
    depth: 3,
    text: "Install the packages used by your examples, then start the development server. Check that the first page renders before adding more content.",
  },
  {
    key: "write",
    title: "Write your first guide",
    depth: 2,
    text: "Describe a task your reader needs to complete. Introduce the smallest working example and explain what they should see when it succeeds.",
  },
  {
    key: "review",
    title: "Review and share",
    depth: 2,
    text: "Follow each step, test the code, and check the links. Share the guide once another reader can complete the task without guessing.",
  },
];

export default function CollapsibleOutline() {
  const prefix = useId();
  const article = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(`${prefix}-setup`);
  const headings = [
    {
      id: `${prefix}-setup`,
      value: "Set up your workspace",
      depth: 2,
      children: [
        { id: `${prefix}-install`, value: "Install dependencies", depth: 3 },
      ],
    },
    { id: `${prefix}-write`, value: "Write your first guide", depth: 2 },
    { id: `${prefix}-review`, value: "Review and share", depth: 2 },
  ];

  function navigateToHeading(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const id = event.currentTarget.dataset.headingId;
    const root = article.current;
    const heading = id ? document.getElementById(id) : null;
    if (!root || !heading || !id) return;
    setSelectedId(id);
    root.scrollTo({
      top:
        root.scrollTop +
        heading.getBoundingClientRect().top -
        root.getBoundingClientRect().top -
        24,
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
        onClick={navigateToHeading}
        aria-current={selectedId === item.id ? "location" : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <div className="outline-demo">
      <div className="outline-demo-panel">
        <p className="outline-demo-label">Quickstart guide</p>
        <DocOutline
          title="On this page"
          headings={headings}
          collapsible
          defaultOpen
          renderLink={renderLink}
        />
        <p className="outline-demo-hint">
          Collapse the outline with its heading. Select a link to jump within
          the article.
        </p>
      </div>
      <div
        ref={article}
        className="outline-demo-article"
        role="region"
        aria-label="Quickstart article"
        tabIndex={0}
      >
        {sections.map((section) => {
          const Heading = section.depth === 2 ? "h2" : "h3";
          return (
            <section key={section.key}>
              <Heading id={`${prefix}-${section.key}`}>{section.title}</Heading>
              <p>{section.text}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
