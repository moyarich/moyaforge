import { useState, type ChangeEvent, type ReactNode } from "react";
import { InteractivePreview } from "../../../../../../../packages/moyaforge-ui/src/components/InteractivePreview/index.js";
import {
  buildFrontmatterRegistry,
  createFrontmatterFiles,
} from "../frontmatter-demo.js";
import { FrontmatterSitePreview } from "../FrontmatterSitePreview.js";

export default function PageMetadataPreview() {
  const [metadata, setMetadata] = useState({
    title: "Installation",
    description: "Set up your first documentation workspace.",
    icon: "book-open",
  });
  const files = createFrontmatterFiles({ page: metadata });
  let preview: ReactNode = (
    <p>Correct the frontmatter to render the sidebar.</p>
  );
  let resolvedMetadata: ReactNode;
  try {
    const registry = buildFrontmatterRegistry(files);
    const page = registry.pages.find(
      (page) => page.file === "01-installation/page.md",
    )!;
    resolvedMetadata = (
      <div className="frontmatter-metadata">
        <strong>{page.title}</strong>
        <p>{page.description}</p>
        <dl>
          <dt>ID</dt>
          <dd>
            <code>{page.id}</code>
          </dd>
          <dt>Route</dt>
          <dd>
            <code>{page.path}</code>
          </dd>
          <dt>Icon</dt>
          <dd>{page.icon}</dd>
        </dl>
        <p className="frontmatter-caption">
          The body heading remains “Installation”; frontmatter does not rewrite
          Markdown.
        </p>
      </div>
    );
    preview = (
      <div className="frontmatter-stage">
        <FrontmatterSitePreview files={files} registry={registry} />
      </div>
    );
  } catch (error) {
    resolvedMetadata = (
      <p role="alert">
        {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }
  function updateMetadata(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.currentTarget;
    setMetadata((previous) => ({ ...previous, [name]: value }));
  }
  return (
    <InteractivePreview
      className="frontmatter-demo"
      title="Page metadata from frontmatter"
      description="Change the title, summary, or icon. Compare the resolved metadata with the rendered sidebar."
      files={files}
      primaryFile="docs/01-installation/page.md"
      metadata={resolvedMetadata}
      previewDescription="Rendered sidebar and page"
      sourceDescription="Example source files"
      controls={
        <div className="frontmatter-fields">
          <label>
            Title
            <input
              name="title"
              value={metadata.title}
              onChange={updateMetadata}
            />
          </label>
          <label>
            Description
            <input
              name="description"
              value={metadata.description}
              onChange={updateMetadata}
            />
          </label>
          <label>
            Icon
            <select name="icon" value={metadata.icon} onChange={updateMetadata}>
              <option value="book-open">book-open</option>
              <option value="settings">settings</option>
              <option value="folder-open">folder-open</option>
            </select>
          </label>
        </div>
      }
    >
      {preview}
    </InteractivePreview>
  );
}
