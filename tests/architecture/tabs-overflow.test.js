import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Tabs } from "../../packages/moyaforge-ui/src/components/Tabs/Tabs.js";
import { TabsList } from "../../packages/moyaforge-ui/src/components/Tabs/TabsList.js";
import { TabsTrigger } from "../../packages/moyaforge-ui/src/components/Tabs/TabsTrigger.js";

const dir = resolve(import.meta.dirname, "../../packages/moyaforge-ui/src/components/Tabs");

test("explicit scroll settings preserve tablist accessibility and tab selection", () => {
  const markup = renderToStaticMarkup(
    h(Tabs, { defaultValue: "one" },
      h(TabsList, { tabsScroll: false, "aria-label": "Open files" },
        h(TabsTrigger, { value: "one" }, "One"),
        h(TabsTrigger, { value: "two" }, "Two"),
      ),
    ),
  );
  expect(markup).toContain('role="tablist"');
  expect(markup).toContain('aria-label="Open files"');
  expect(markup).toContain('aria-selected="true"');
  expect(markup).toContain("mf-tabs-list-container");
  expect(markup).not.toContain("Scroll tabs right");
  expect(markup).not.toContain("mf-tabs-scroll\"");

  const enabled = renderToStaticMarkup(
    h(Tabs, { defaultValue: "one" },
      h(TabsList, { tabsScroll: true, "aria-label": "Open files" },
        h(TabsTrigger, { value: "one" }, "One"),
      ),
    ),
  );
  expect(enabled).toContain("mf-tabs-scroll");
});

test("tab overflow styling provides scroll-position arrows and CSS-themed fades", async () => {
  const [script, css] = await Promise.all([
    readFile(resolve(dir, "TabsList.tsx"), "utf8"),
    readFile(resolve(dir, "TabsList.css"), "utf8"),
  ]);
  expect(script).toContain("ResizeObserver");
  expect(script).toContain('element.addEventListener("scroll", update');
  expect(script).toContain('aria-label="Scroll tabs left"');
  expect(script).toContain('aria-label="Scroll tabs right"');
  expect(css).toContain(".mf-tabs-scroll .mf-tabs-list--fade-left");
  expect(css).toContain(".mf-tabs-scroll .mf-tabs-list--fade-right");
  expect(css).toContain("var(--mf-tabs-scroll-fade-width, 2.5rem)");
  expect(css).toContain("var(--mf-tabs-scroll-button-width, 1.75rem)");
  expect(css).toContain(".mf-tabs-scroll .mf-tabs-scroll-button");
});
