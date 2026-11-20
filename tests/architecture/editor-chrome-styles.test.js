import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const styles = (path) => readFile(resolve(root, "packages/moyaforge-ui/src/components", path), "utf8");

describe("editor chrome stylesheet boundaries", () => {
  test("restores the classic toolbar, active underline, and textarea defaults", async () => {
    const css = await styles("EditorContainer/EditorContainer.css");
    expect(css).toContain("--mf-editor-toolbar-min-height, 3rem");
    expect(css).toContain("--mf-editor-toolbar-border-width, 1px");
    expect(css).toContain("--mf-tabs-indicator-size, 2px");
    expect(css).toContain("--mf-tabs-corner-size, 0px");
    expect(css).toContain("--mf-editor-textarea-padding, 1.25rem");
    expect(css).toContain("--mf-editor-textarea-min-height, 14rem");
    expect(css).toContain(".mf-editor-tools button");
  });

  test("keeps both the flat and curved tab appearance CSS-variable driven", async () => {
    const [container, tabs, trigger, panel] = await Promise.all([
      styles("EditorContainer/EditorContainer.css"),
      styles("Tabs/Tabs.css"),
      styles("Tabs/TabsTrigger.css"),
      styles("Tabs/TabsContent.css"),
    ]);
    expect(container).toContain("var(--mf-tabs-active-background, transparent)");
    expect(container).toContain("var(--mf-tabs-corner-size, 0px)");
    expect(tabs).toContain("--_mf-tabs-indicator-size");
    expect(trigger).toContain(".mf-tabs-item--active::before");
    expect(panel).toContain("var(--mf-tabs-content-padding, 0)");
    for (const css of [container, tabs, trigger, panel])
      expect(css).not.toContain("[data-");
  });

  test("does not restore Monaco-owned chrome styles", async () => {
    const [container, workspace] = await Promise.all([
      styles("EditorContainer/EditorContainer.css"),
      styles("EditorWorkspace/EditorWorkspace.css"),
    ]);
    expect(container).toContain(".mf-editor-container");
    expect(workspace).toContain(".mf-editor-workspace-readonly");
    expect(container).not.toContain("[data-moyaforge-monaco]");
  });
});
