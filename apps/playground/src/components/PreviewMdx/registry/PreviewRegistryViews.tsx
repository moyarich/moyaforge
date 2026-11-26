import "../frontmatter/FrontmatterDemos.css";
import "./PreviewRegistryViews.css";
import { useState, type ChangeEvent } from "react";
import { PreviewInteractive } from "../../../../../../packages/moyaforge-ui/src/components/PreviewInteractive/index.js";
import { createVirtualRegistry } from "../virtual-registry.js";
import { PreviewFrontmatterSite } from "../frontmatter/PreviewFrontmatterSite.js";
import type { NavigationMode } from "../../../../../../packages/moyaforge-mdx/src/registry/index.js";

export default function PreviewRegistryViews() {
  const [source, setSource] = useState("docs");
  const [navigation, setNavigation] = useState<NavigationMode>("visible");
  const { files, registry } = createVirtualRegistry({
    [source]: {
      "page.md":
        "---\ntitle: Guide\nsidebar:\n  group: true\n  collapsible: true\n  defaultOpen: true\n---\n\n# Guide\n\nChoose a page in the sidebar to get started.\n",
      "01-installation/page.md": `---\ntitle: Installation\nnavigation: ${navigation}\n---\n\n# Installation\n\nInstall dependencies and run your development server.\n`,
      "02-authoring/page.md":
        "---\ntitle: Authoring\n---\n\n# Authoring\n\nWrite one useful guide at a time.\n",
    },
  });
  function updateSource(event: ChangeEvent<HTMLSelectElement>) {
    setSource(event.currentTarget.value);
  }
  function updateNavigation(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    if (value === "visible" || value === "hidden" || value === "disabled")
      setNavigation(value);
  }
  return (
    <PreviewInteractive
      className="frontmatter-demo"
      title="Files, routes, and navigation"
      description="One virtual source, three documents, and the registry views used by your app."
      files={files}
      primaryFile={`${source}/01-installation/page.md`}
      sourceDescription="Example source files"
      previewDescription="Registry output and working sidebar"
      controls={
        <div className="frontmatter-fields">
          <label>
            Source key
            <select value={source} onChange={updateSource}>
              <option>docs</option>
              <option>handbook</option>
            </select>
          </label>
          <label>
            Installation visibility
            <select value={navigation} onChange={updateNavigation}>
              <option>visible</option>
              <option>hidden</option>
              <option>disabled</option>
            </select>
          </label>
        </div>
      }
      metadata={
        <div className="frontmatter-metadata">
          <dl>
            <dt>pages</dt>
            <dd>{registry.pages.length} discovered documents</dd>
            <dt>routes</dt>
            <dd>{registry.routes.length} routable pages</dd>
            <dt>navigation</dt>
            <dd>{registry.navigation.length} visible pages</dd>
          </dl>
          <p className="frontmatter-caption">
            The source key changes the route prefix. Visibility changes
            inventory membership, not the source filename.
          </p>
        </div>
      }
    >
      <div className="registry-views-table">
        <table>
          <caption>Generated page records</caption>
          <thead>
            <tr>
              <th>Source-relative file</th>
              <th>Route</th>
              <th>Routable</th>
              <th>In sidebar</th>
            </tr>
          </thead>
          <tbody>
            {registry.pages.map((page) => (
              <tr key={page.path}>
                <td>
                  <code>{page.file}</code>
                </td>
                <td>
                  <code>{page.path}</code>
                </td>
                <td>{registry.byPath.has(page.path) ? "Yes" : "No"}</td>
                <td>{registry.navigation.includes(page) ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PreviewFrontmatterSite files={files} registry={registry} />
    </PreviewInteractive>
  );
}
