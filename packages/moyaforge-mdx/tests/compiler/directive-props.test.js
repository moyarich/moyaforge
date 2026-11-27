import { test, expect } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

const options = createMdxOptions({ componentMappings: {
  card: { component: "Card", titleProp: "title" },
  "code-group": { component: "CodeGroup", childType: "tab", childComponent: "CodeTab" },
  "preview-code": { component: "PreviewCodeInline", sourceProp: "code", titleProp: "title" },
  "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
} });

test.each([
  ':::card[Example]{futureFlag count=3 enabled=false title="Explicit" variant="outline" empty="" options=\'json:{"gap":8}\'}',
  '::: card Example {futureFlag count=3 enabled=false title="Explicit" variant="outline" empty="" options=\'json:{"gap":8}\'}',
])("forwards new props without a mapping change: %s", async (header) => {
  const output = String(await compile(header + "\n\nContent\n\n:::", options));
  expect(output).toContain("futureFlag: true");
  expect(output).toContain("count: 3");
  expect(output).toContain("enabled: false");
  expect(output).toContain('title: "Explicit"');
  expect(output).toContain('variant: "outline"');
  expect(output).toContain('empty: ""');
  expect(output).toContain("options:");
  expect(output).toContain("8");
});

test("nested and wildcard directives forward props", async () => {
  const output = String(await compile("::::code-group[Group]{futureGroup}\n\n:::tab[Tab]{futureTab size=2}\n\nContent\n\n:::\n\n::::\n\n:::notice[Notice]{futureNotice component=\"ordinary\"}\n\nText\n\n:::", options));
  expect(output).toContain("futureGroup: true");
  expect(output).toContain("futureTab: true");
  expect(output).toContain("size: 2");
  expect(output).toContain("futureNotice: true");
  expect(output).toContain('component: "ordinary"');
});

test("preview props are generic but compiler controls remain reserved", async () => {
  const output = String(await compile(':::preview-code[Example]{refresh defaultOutputOpen=false outputLabel="Console"}\n\n<p>Example</p>\n\n:::', options));
  expect(output).toContain("refresh: true");
  expect(output).toContain("defaultOutputOpen: false");
  expect(output).toContain('outputLabel: "Console"');
  expect(output).toContain("code:");
});

test("rejects unsafe structural props", async () => {
  await expect(compile(':::card{dangerouslySetInnerHTML="bad"}\n\nContent\n\n:::', options)).rejects.toThrow(/Unsupported directive prop/);
});
