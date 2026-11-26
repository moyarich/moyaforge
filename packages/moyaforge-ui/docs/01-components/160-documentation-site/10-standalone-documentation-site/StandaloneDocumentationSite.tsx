import "./StandaloneDocumentationSite.css";
import { useState } from "react";
import { DocumentationSite } from "../../../../src/components/Layout/DocumentationSite/index.js";

const pages = [
  {
    path: "/guide",
    parentPath: null,
    title: "Getting started",
    summary: "Everything you need to start building with your team.",
    heading: "A clear place to begin",
    body: "Keep the first steps simple. Introduce the project, explain what readers can build, and guide them toward a working local setup.",
    steps: [
      "Create a workspace for your documentation.",
      "Add a short guide with a descriptive title.",
      "Share it with the people who need it.",
    ],
  },
  {
    path: "/guide/installation",
    parentPath: "/guide",
    title: "Installation",
    summary: "Get a local workspace ready in a few small steps.",
    heading: "Set up your project",
    body: "Start with a React application and install your documentation components. Supply page data and a navigation callback to connect the shell to your application.",
    steps: [
      "Install your project dependencies.",
      "Configure the content sources you want to publish.",
      "Start the development server and open your guide.",
    ],
  },
  {
    path: "/guide/authoring",
    parentPath: "/guide",
    title: "Authoring pages",
    summary: "Write useful guides with examples readers can follow.",
    heading: "Make the next step obvious",
    body: "Give every page a single purpose. Show complete examples, explain the expected result, and use links to help readers continue when they finish a task.",
    steps: [
      "Use headings that describe the reader’s task.",
      "Include the imports and styles an example needs.",
      "Check your links and review the published page.",
    ],
  },
];

async function searchPages(query: string) {
  const term = query.trim().toLowerCase();
  return pages
    .filter((page) =>
      `${page.title} ${page.summary}`.toLowerCase().includes(term),
    )
    .map((page) => ({ path: page.path, label: page.title }));
}

export default function StandaloneDocumentationSite() {
  const [currentPath, setCurrentPath] = useState(pages[0].path);
  const page = pages.find((candidate) => candidate.path === currentPath)!;

  return (
    <div className="standalone-site-example">
      <DocumentationSite
        title="Atlas docs"
        pages={pages}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        onSearch={searchPages}
        searchShortcut={{}}
        sidebarLabel="Handbook"
        sidebarVersion="v1.0"
        sidebarFooter={
          <p className="standalone-site-note">
            A small guide, owned by your app.
          </p>
        }
        outline={null}
      >
        <h1>{page.title}</h1>
        <p className="standalone-site-summary">{page.summary}</p>
        <section>
          <h2>{page.heading}</h2>
          <p>{page.body}</p>
          <ol>
            {page.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <aside className="standalone-site-tip">
          <strong>Try the shell</strong>
          <p>
            Choose a page in the sidebar, search for “installation”, or use the
            page links below. Everything stays inside this preview.
          </p>
        </aside>
      </DocumentationSite>
    </div>
  );
}
