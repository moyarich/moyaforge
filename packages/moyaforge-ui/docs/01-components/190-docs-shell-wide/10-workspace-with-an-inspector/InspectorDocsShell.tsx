import "./InspectorDocsShell.css";
import { useState, type MouseEvent } from "react";
import { PageInspector, type PageProperties } from "./PageInspector.js";
import { FileText, PanelRight, PanelsTopLeft } from "lucide-react";
import { PreviewInspector } from "../../../../src/components/PreviewInspector/index.js";
import { DocsShellWide } from "../../../../src/components/DocsShellWide/DocsShellWide.js";

const initialPages = [
  {
    id: "overview",
    title: "Project overview",
    summary:
      "A shared home for your team’s guides, decisions, and component documentation.",
    status: "Draft",
  },
  {
    id: "quickstart",
    title: "Quickstart",
    summary:
      "Install the tools, create your first page, and preview the site locally.",
    status: "Published",
  },
  {
    id: "components",
    title: "Component library",
    summary:
      "Explore reusable components with live previews and copyable source code.",
    status: "Draft",
  },
];

export default function InspectorDocsShell() {
  const [pages, setPages] = useState(initialPages);
  const [selectedId, setSelectedId] = useState("overview");
  const [showInspector, setShowInspector] = useState(true);
  const selected = pages.find((page) => page.id === selectedId)!;

  function selectPage(event: MouseEvent<HTMLButtonElement>) {
    setSelectedId(event.currentTarget.value);
  }

  function updatePage(changes: Partial<PageProperties>) {
    setPages((previous) =>
      previous.map((page) =>
        page.id === selectedId ? { ...page, ...changes } : page,
      ),
    );
  }

  function toggleInspector() {
    setShowInspector((previous) => !previous);
  }

  return (
    <div className="wide-shell-example">
      <DocsShellWide
        header={
          <div className="workspace-heading">
            <PanelsTopLeft aria-hidden="true" />
            <strong>Documentation workspace</strong>
            <span className="workspace-badge">Demo</span>
          </div>
        }
        toolbar={
          <div className="workspace-toolbar">
            <span>
              Pages <span aria-hidden="true">/</span>{" "}
              {selected.title || "Untitled page"}
            </span>
            <button
              type="button"
              onClick={toggleInspector}
              aria-pressed={showInspector}
            >
              <PanelRight aria-hidden="true" />
              Inspector
            </button>
          </div>
        }
        navigation={
          <nav className="workspace-navigation" aria-label="Workspace pages">
            <p className="workspace-label">Pages</p>
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                value={page.id}
                onClick={selectPage}
                aria-current={page.id === selectedId ? "page" : undefined}
              >
                <FileText aria-hidden="true" />
                <span>{page.title || "Untitled page"}</span>
              </button>
            ))}
          </nav>
        }
        footer={
          <div className="workspace-footer">
            <span>{pages.length} pages</span>
            <span>Changes stay in this preview</span>
          </div>
        }
      >
        <PreviewInspector
          label="Page preview"
          inspector={
            showInspector ? (
              <PageInspector page={selected} onChange={updatePage} />
            ) : null
          }
        >
          <article className="workspace-document">
            <div className="workspace-document-icon">
              <FileText aria-hidden="true" />
            </div>
            <span className="workspace-badge">{selected.status}</span>
            <h2>{selected.title || "Untitled page"}</h2>
            <p>{selected.summary || "Add a summary in the inspector."}</p>
            <div className="workspace-note">
              <strong>One layout, replaceable slots</strong>
              <p>
                Select a page to inspect its properties. The preview updates
                as you edit them.
              </p>
            </div>
          </article>
        </PreviewInspector>
      </DocsShellWide>
    </div>
  );
}
