import "./GuideWithSidebar.css";
import { useState, type MouseEvent } from "react";
import { BookOpen } from "lucide-react";
import { DocsLayout } from "../../../../src/components/Layout/DocsLayout/DocsLayout.js";

const pages = [
  {
    url: "/guide/overview",
    title: "Overview",
    summary: "A home for the knowledge your team builds together.",
    heading: "Start with the essentials",
    body: "Organize your guides around the tasks readers need to complete. Keep each page focused, and link to the next step when they are ready to continue.",
  },
  {
    url: "/guide/installation",
    title: "Installation",
    summary: "Set up a local workspace and publish your first page.",
    heading: "Create your workspace",
    body: "Initialize your documentation project, install its dependencies, and start the development server. Your content stays in Markdown files alongside your application.",
  },
  {
    url: "/guide/authoring",
    title: "Authoring",
    summary: "Turn useful ideas into clear, discoverable documentation.",
    heading: "Write for the next reader",
    body: "Use descriptive titles, short sections, and examples that readers can copy. Give each guide a clear purpose and check the links before sharing it.",
  },
];

export default function GuideWithSidebar() {
  const [currentUrl, setCurrentUrl] = useState(pages[0].url);
  const currentIndex = pages.findIndex((page) => page.url === currentUrl);
  const page = pages[currentIndex];

  function navigateWithinDemo(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    const destination = link?.getAttribute("href");
    if (
      !destination ||
      !pages.some((candidate) => candidate.url === destination)
    )
      return;
    event.preventDefault();
    setCurrentUrl(destination);
  }

  function nextPage() {
    setCurrentUrl(pages[currentIndex + 1].url);
  }

  return (
    <div className="guide-shell-example" onClickCapture={navigateWithinDemo}>
      <DocsLayout
        title="Team handbook"
        pages={pages}
        currentUrl={currentUrl}
        header={
          <div className="guide-shell-brand">
            <BookOpen aria-hidden="true" />
            <strong>Team handbook</strong>
            <span>Getting started</span>
          </div>
        }
        outline={null}
        footer={
          <footer className="guide-shell-footer">
            <span>
              Page {currentIndex + 1} of {pages.length}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={currentIndex === pages.length - 1}
            >
              Next page →
            </button>
          </footer>
        }
      >
        <p className="guide-shell-eyebrow">Guide</p>
        <h2>{page.title}</h2>
        <p className="guide-shell-summary">{page.summary}</p>
        <section>
          <h3>{page.heading}</h3>
          <p>{page.body}</p>
        </section>
        <aside className="guide-shell-note">
          <strong>Try the navigation</strong>
          <p>
            Select a page in the sidebar. The host updates{" "}
            <code>currentUrl</code> and the content; the layout marks the
            matching link as active.
          </p>
        </aside>
      </DocsLayout>
    </div>
  );
}
