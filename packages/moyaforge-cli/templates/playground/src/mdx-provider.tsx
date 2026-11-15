import { lazy, type ReactNode } from "react";
import { CODE_REPLACEMENTS, CodePreview, type PreviewFile } from "__UI__/CodePreview/index.js";
import { HighlightedCode, previewLanguage } from "__UI__/HighlightedCode/HighlightedCode.js";
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
function InlineCodePreview({ title = "Example", code, sourceFiles, component, sourceOnly, replacementPreset, children }: {
  title?: string;
  code: string;
  sourceFiles?: string;
  component?: string;
  sourceOnly?: boolean;
  replacementPreset?: "portable";
  children: ReactNode;
}) {
  const files: PreviewFile[] = sourceFiles ? JSON.parse(sourceFiles) : [];
  if (code || !files.length) files.unshift({ label: "Example.mdx", code, language: "markdown" });
  const Example = component ? examples[component] : undefined;
  if (component && !Example) throw new Error(`Unknown preview component: ${component}`);
  const source = files[0];
  const previewContent = sourceOnly && source
    ? <pre><HighlightedCode code={source.code} language={source.language ?? previewLanguage(source.label)} /></pre>
    : Example ? <Example /> : children;
  return (
    <CodePreview title={title} files={files} replacements={replacementPreset === "portable" ? CODE_REPLACEMENTS : undefined}>
      {previewContent}
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
