import { describe, expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RendererSwitcher } from "../../src/components/RendererSwitcher/index.ts";

describe("RendererSwitcher", () => {
  test("renders independently configurable renderer and theme selectors", () => {
    const html = renderToStaticMarkup(h(RendererSwitcher));
    expect(html).toContain('aria-label="Renderer"');
    expect(html).toContain('aria-label="Theme"');
    expect(html).toContain('data-preview-renderer="default"');
    expect(html).toContain('data-preview-theme="neutral"');
    expect(html).toContain("Experimental Feature");
    expect(html).toContain('role="tablist"');
  });

  test("accepts reusable preview content instead of requiring a playground fixture", () => {
    const html = renderToStaticMarkup(h(RendererSwitcher, null, h("p", null, "Reusable example")));
    expect(html).toContain("Reusable example");
    expect(html).not.toContain("Experimental Feature");
  });
});
