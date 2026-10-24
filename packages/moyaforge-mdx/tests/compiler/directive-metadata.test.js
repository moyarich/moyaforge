import assert from "node:assert/strict";
import { test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

const options = createMdxOptions({
  directiveComponents: {
    "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
    "code-group": {
      component: "CodeGroup",
      childType: "tab",
      childComponent: "CodeTab",
    },
  },
});

test("compiler supplies canonical arbitrary admonition metadata", async () => {
  const source = "::: WARNING Compatibility\nUse **caution**.\n:::";
  const output = String(
    await compile({ value: source, path: "page.mdx" }, options),
  );
  assert.match(output, /CustomBlock/);
  assert.match(output, /type: "warning"/);
  assert.match(output, /title: "Compatibility"/);
  assert.match(output, /caution/);
});

test("compiler supplies tab labels for interactive code groups", async () => {
  const source = [
    ":::: code-group",
    "",
    "::: tab JavaScript",
    "```js",
    "const a = 1;",
    "```",
    ":::",
    "",
    "::: tab TypeScript",
    "```ts",
    "const b: number = 2;",
    "```",
    ":::",
    "",
    "::::",
  ].join("\n");
  const output = String(
    await compile({ value: source, path: "page.mdx" }, options),
  );
  assert.match(output, /CodeGroup/);
  assert.match(output, /CodeTab/);
  assert.match(output, /label: "JavaScript"/);
  assert.match(output, /label: "TypeScript"/);
  assert.match(output, /"data-language": "js"/);
  assert.match(output, /"data-language": "ts"/);
});
