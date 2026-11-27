import type { ReactNode } from "react";
import { PreviewCode } from "__UI__/PreviewCode/index.js";
import { BookOpen } from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { DocumentationLink } from "@moyarich/moyaforge/headless";
import { CodeBlock } from "__UI__/CodeBlock/index.js";
import { CodeGroup, CodeTab } from "__UI__/CodeGroup/index.js";
import { Card } from "__UI__/Card/index.js";
import { CustomBlock } from "__UI__/CustomBlock/index.js";

const components = {
  PreviewCode,
  a: DocumentationLink,
  BookOpen,
  pre: CodeBlock,
  CodeBlock,
  CodeGroup,
  CodeTab,
  CustomBlock,
  Card,
};

export function PlaygroundMdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
