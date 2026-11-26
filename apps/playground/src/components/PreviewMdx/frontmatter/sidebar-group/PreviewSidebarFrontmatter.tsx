import { useState, type ChangeEvent } from "react";
import { PreviewInteractive } from "../../../../../../../packages/moyaforge-ui/src/components/PreviewInteractive/index.js";
import { PreviewFrontmatterSite } from "../PreviewFrontmatterSite.js";
import {
  createFrontmatterDemo,
  type SidebarGroupSettings,
} from "../frontmatter-demo.js";

export default function PreviewSidebarFrontmatter() {
  const [settings, setSettings] = useState<SidebarGroupSettings>({
    group: true,
    collapsible: true,
    defaultOpen: true,
  });
  const { files, registry } = createFrontmatterDemo({ sidebar: settings });

  function updateSetting(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.currentTarget;
    if (name === "group" || name === "collapsible" || name === "defaultOpen") {
      setSettings((previous) => ({ ...previous, [name]: checked }));
    }
  }

  return (
    <PreviewInteractive
      className="frontmatter-demo"
      title="Sidebar group from frontmatter"
      description="Change the settings to update the sidebar and its Markdown source."
      files={files}
      primaryFile="docs/page.md"
      previewDescription="Rendered sidebar and page"
      sourceDescription="Example source files"
      metadata={
        <div className="frontmatter-metadata">
          <dl>
            <dt>Source title</dt>
            <dd>Guide</dd>
            <dt>Promoted heading</dt>
            <dd>{settings.group ? "Yes" : "No"}</dd>
            <dt>Collapsible</dt>
            <dd>{settings.group && settings.collapsible ? "Yes" : "No"}</dd>
            <dt>Initial state</dt>
            <dd>{settings.defaultOpen ? "Expanded" : "Collapsed"}</dd>
          </dl>
        </div>
      }
      controls={
        <>
          <div className="frontmatter-options">
            <label>
              <span>
                <strong>Group heading</strong>
                <small>Promote Guide above its pages</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="group"
                checked={settings.group}
                onChange={updateSetting}
              />
            </label>
            <label>
              <span>
                <strong>Collapsible</strong>
                <small>Allow the group to close</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="collapsible"
                checked={settings.collapsible}
                onChange={updateSetting}
                disabled={!settings.group}
              />
            </label>
            <label>
              <span>
                <strong>Start expanded</strong>
                <small>Set the initial open state</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="defaultOpen"
                checked={settings.defaultOpen}
                onChange={updateSetting}
                disabled={!settings.group || !settings.collapsible}
              />
            </label>
          </div>
          <p className="frontmatter-hint">
            Without promotion, Documentation is the source label and Guide
            remains a page beneath it.
          </p>
        </>
      }
    >
      <div className="frontmatter-stage">
        <PreviewFrontmatterSite
          key={JSON.stringify(settings)}
          files={files}
          initialFile="page.md"
          registry={registry}
        />
      </div>
    </PreviewInteractive>
  );
}
