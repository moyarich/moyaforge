import { lazy, type ReactNode } from "react";
import { CODE_REPLACEMENTS, CodePreview, type PreviewFile } from "__UI__/CodePreview/index.js";
import { BookOpen } from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { DocumentationLink } from "@moyarich/moyaforge/headless";
import { CodeBlock } from "__UI__/CodeBlock/index.js";
import { CodeGroup, CodeTab } from "__UI__/CodeGroup/index.js";
import { CustomBlock } from "__UI__/CustomBlock/index.js";

import componentModules from "virtual:moyaforge-mdx/code-preview-components";

const examples = Object.fromEntries(
  Object.entries(componentModules).map(([key, load]) => [key, lazy(load)]),
);

// Use the registry's CodePreview with source collected by the MDX compiler.
function InlineCodePreview({ title = "Example", code, sourceFiles, example, replacementPreset, children }: {
  title?: string;
  code: string;
  sourceFiles?: string;
  example?: string;
  replacementPreset?: "portable";
  children: ReactNode;
}) {
  const files: PreviewFile[] = sourceFiles ? JSON.parse(sourceFiles) : [];
  if (code || !files.length) files.unshift({ label: "Example.mdx", code, language: "markdown" });
  const Example = example ? examples[example] : undefined;
  if (example && !Example) throw new Error(`Unknown preview example: ${example}`);
  return (
    <CodePreview title={title} files={files} replacements={replacementPreset === "portable" ? CODE_REPLACEMENTS : undefined}>
      {Example ? <Example /> : children}
    </CodePreview>
  );
}

const components = {
  InlineCodePreview,
  a: DocumentationLink,
  BookOpen,
  pre: CodeBlock,
  CodeBlock,
  CodeGroup,
  CodeTab,
  CustomBlock,
};

export function PlaygroundMdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
