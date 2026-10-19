import { expect, test } from "vitest";
import { defineMdxComponentRegistry } from "../../src/mdx-registry.ts";
import {
  CodeGroup,
  CodeTab,
} from "../../../moyaforge-ui/src/components/CodeGroup/index.ts";

test("MDX components are supplied by the host", () => {
  const components = defineMdxComponentRegistry({ CodeGroup, CodeTab });
  expect(components.CodeGroup).toBe(CodeGroup);
  expect(components.CodeTab).toBe(CodeTab);
  expect(components.Console).toBeUndefined();
});
test("host overrides replace only explicitly supplied components", () => {
  const Replacement = () => null;
  const components = defineMdxComponentRegistry(
    { CodeGroup, CodeTab },
    { CodeGroup: Replacement },
  );
  expect(components.CodeGroup).toBe(Replacement);
  expect(components.CodeTab).toBe(CodeTab);
});
