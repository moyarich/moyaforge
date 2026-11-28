import { useEffect, useId, useState } from "react";
import type { MDXComponents, MDXContent } from "mdx/types";
import { compileVirtualPage } from "./compile-virtual-page.js";

export interface VirtualPageProps {
  source: string;
  filename: string;
  headingPrefix?: string;
  components?: MDXComponents;
}

/** Render the actual body of a virtual document; metadata remains in the registry. */
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
