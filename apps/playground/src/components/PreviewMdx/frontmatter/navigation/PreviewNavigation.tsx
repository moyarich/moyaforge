import { useState, type ChangeEvent } from "react";
import type { NavigationMode } from "../../../../../../../packages/moyaforge-mdx/src/registry/index.js";
import { PreviewInteractive } from "../../../../../../../packages/moyaforge-ui/src/components/PreviewInteractive/index.js";
import { createFrontmatterDemo } from "../frontmatter-demo.js";
import { PreviewFrontmatterSite } from "../PreviewFrontmatterSite.js";

export default function PreviewNavigation() {
  const [navigation, setNavigation] = useState<NavigationMode>("visible");
  const [order, setOrder] = useState(1);
  const { files, registry } = createFrontmatterDemo({
    page: { navigation, order },
  });
  const routable = registry.byPath.has("/docs/installation");

  function updateNavigation(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    if (value === "visible" || value === "hidden" || value === "disabled")
      setNavigation(value);
  }
  function updateOrder(event: ChangeEvent<HTMLSelectElement>) {
    setOrder(Number(event.currentTarget.value));
  }

  return (
    <PreviewInteractive
      className="frontmatter-demo"
      title="Navigation from frontmatter"
      description="Change Installation’s visibility and order relative to Authoring (order 2)."
      files={files}
      metadata={
        <div className="frontmatter-metadata">
          <p>
            <strong>Installation</strong>
          </p>
          <dl>
            <dt>Direct route</dt>
            <dd>{routable ? "Available" : "Excluded"}</dd>
            <dt>In navigation</dt>
            <dd>{navigation === "visible" ? "Listed" : "Not listed"}</dd>
            <dt>Resolved order</dt>
            <dd>{order}</dd>
          </dl>
          <p className="frontmatter-caption">
            Hidden pages remain routable. Disabled pages are excluded from
            routes. Neither appears in the sidebar.
          </p>
        </div>
      }
      primaryFile="docs/01-installation/page.md"
      previewDescription="Rendered sidebar and page"
      sourceDescription="Example source files"
      controls={
        <div className="frontmatter-fields">
          <label>
            Navigation
            <select value={navigation} onChange={updateNavigation}>
              <option>visible</option>
              <option>hidden</option>
              <option>disabled</option>
            </select>
          </label>
          <label>
            Order
            <select value={order} onChange={updateOrder}>
              <option value={0}>0 — before Authoring</option>
              <option value={3}>3 — after Authoring</option>
              <option value={1}>1 — filename default</option>
            </select>
          </label>
        </div>
      }
    >
      <div className="frontmatter-stage">
        <PreviewFrontmatterSite files={files} registry={registry} />
      </div>
    </PreviewInteractive>
  );
}
