import { evaluate } from "@mdx-js/mdx";
import { test, expect } from "vitest";
import { createMdxOptions } from "../../dist/index.js";

const options = createMdxOptions({ componentMappings: {
  "preview-code": { component: "PreviewCode", directPreviewCode: true, titleProp: "title" },
} });

test("direct mapping emits typed source files and arbitrary component props", async () => {
  let captured;
  const jsx = (type, props) => {
    if (typeof type === "function") return type(props);
    return { type, props };
  };
  const { default: Page } = await evaluate(
    ':::preview-code[Greeting]{refresh defaultOutputOpen=false replacements="portable"}\n\nHello\n\n:::',
    { ...options, jsx, jsxs: jsx, Fragment: "fragment", useMDXComponents: () => ({
      PreviewCode: props => { captured = props; return null; },
    }) },
  );
  Page({});
  expect(captured.files).toEqual([{ label: "Example.mdx", code: "Hello", language: "mdx" }]);
  expect(captured.title).toBe("Greeting");
  expect(captured.refresh).toBe(true);
  expect(captured.defaultOutputOpen).toBe(false);
  expect(captured.replacementPreset).toBe("portable");
  expect(captured).not.toHaveProperty("sourceFiles");
});
