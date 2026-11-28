import { useEffect, useId, useState } from "react";
import type { MDXComponents, MDXContent } from "mdx/types";
import { compileVirtualPage } from "./compile-virtual-page.js";

/** Input and rendering options for an isolated Markdown or MDX preview. */
export interface VirtualPageProps {
  /** Trusted document text, optionally beginning with YAML frontmatter. */
  source: string;
  /** Document path used for diagnostics and Markdown/MDX format selection. */
  filename: string;
  /** Prefix for generated heading IDs; defaults to a per-instance React ID followed by a hyphen. */
  headingPrefix?: string;
  /** Optional MDX component overrides for elements rendered by the document. */
  components?: MDXComponents;
}

/**
 * Render a trusted Markdown or MDX document without registering an application route.
 *
 * Compiles the body asynchronously whenever the source, filename, or heading
 * prefix changes. YAML frontmatter is excluded from the rendered body; use
 * createVirtualRegistry separately when navigation or page metadata is needed.
 *
 * @param props - Document text, filename, heading prefix, and component overrides.
 * @returns The rendered document, a loading status, or an alert containing the compilation error.
 * @remarks MDX evaluation can execute JavaScript. Never pass untrusted content.
 * @example
 * ```tsx
 * <VirtualPage
 *   source={"# Getting started"}
 *   filename="page.md"
 *   headingPrefix="demo-"
 * />
 * ```
 */
export function VirtualPage({
  source,
  filename,
  headingPrefix,
  components,
}: VirtualPageProps) {
  const id = useId();
  const prefix = headingPrefix ?? `${id}-`;
  const [result, setResult] = useState<{
    source: string;
    filename: string;
    Content?: MDXContent;
    error?: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    compileVirtualPage(source, filename, prefix).then(
      (module) => {
        if (active) setResult({ source, filename, Content: module.default });
      },
      (error) => {
        if (active)
          setResult({
            source,
            filename,
            error: error instanceof Error ? error.message : String(error),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [source, filename, prefix]);
  if (!result || result.source !== source || result.filename !== filename)
    return <p role="status">Rendering page…</p>;
  if (result.error)
    return (
      <p role="alert">
        {filename}: {result.error}
      </p>
    );
  const Content = result.Content!;
  return <Content components={components} />;
}
