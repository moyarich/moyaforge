import { lazy, type ReactNode } from "react";
import { CODE_REPLACEMENTS, PreviewCode, type PreviewFile } from "__UI__/PreviewCode/index.js";
import { HighlightedCode, previewLanguage } from "__UI__/HighlightedCode/HighlightedCode.js";
import { BookOpen } from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { DocumentationLink } from "@moyarich/moyaforge/headless";
import { CodeBlock } from "__UI__/CodeBlock/index.js";
import { CodeGroup, CodeTab } from "__UI__/CodeGroup/index.js";
import { CustomBlock } from "__UI__/CustomBlock/index.js";

import componentModules from "virtual:moyaforge-mdx/preview-code-components";

const examples = new Map<string, ReturnType<typeof lazy>>();

/** Stable lazy component for the registered file and optional #NamedExport. */
function resolvePreviewExample(reference: string) {
  const hash = reference.lastIndexOf("#");
  const moduleKey = hash < 0 ? reference : reference.slice(0, hash);
  const exportName = hash < 0 ? "default" : reference.slice(hash + 1);
  const load = componentModules[moduleKey];
  if (!load) return undefined;

  let Example = examples.get(reference);
  if (!Example) {
    Example = lazy(async () => {
      const module = await load();
      const component = module[exportName];
      if (!component)
        throw new Error(`Missing preview export "${exportName}" in "${moduleKey}".`);
      return { default: component };
    });
    examples.set(reference, Example);
  }
  return Example;
}

// Use the registry's PreviewCode with source collected by the MDX compiler.
function PreviewCodeInline({ title = "Example", code, sourceFiles, component, sourceOnly, replacementPreset, children }: {
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
  const Example = component ? resolvePreviewExample(component) : undefined;
  if (component && !Example) throw new Error(`Unknown preview component: ${component}`);
  const source = files[0];
  const previewContent = sourceOnly && source
    ? <pre><HighlightedCode code={source.code} language={source.language ?? previewLanguage(source.label)} /></pre>
    : Example ? <Example /> : children;
  return (
    <PreviewCode title={title} files={files} replacements={replacementPreset === "portable" ? CODE_REPLACEMENTS : undefined}>
      {previewContent}
    </PreviewCode>
  );
}

const components = {
  PreviewCodeInline,
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
