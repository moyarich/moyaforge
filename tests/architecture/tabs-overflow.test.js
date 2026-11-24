import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Tabs } from "../../packages/moyaforge-ui/src/components/Tabs/Tabs.js";
import { TabsList } from "../../packages/moyaforge-ui/src/components/Tabs/TabsList.js";
import { TabsTrigger } from "../../packages/moyaforge-ui/src/components/Tabs/TabsTrigger.js";

test.each([true, false])("tablist remains accessible with tabsScroll=%s", (tabsScroll) => {
  const markup = renderToStaticMarkup(
    h(Tabs, { defaultValue: "one" },
      h(TabsList, { tabsScroll, "aria-label": "Open files" },
        h(TabsTrigger, { value: "one" }, "One"),
        h(TabsTrigger, { value: "two" }, "Two"),
      ),
    ),
  );
  expect(markup).toContain('role="tablist"');
  expect(markup).toContain('aria-label="Open files"');
  expect(markup).toContain('aria-selected="true"');
  expect(markup).toContain('aria-selected="false"');
});
