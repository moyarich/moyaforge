import {
  HighlightedCode,
  previewLanguage,
} from "../HighlightedCode/HighlightedCode.js";
import { useState, type ReactNode } from "react";
import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewCopyButton,
  PreviewRefreshButton,
  PreviewContent,
  PreviewSource,
  PreviewOutput,
  PreviewOutputToggle,
} from "../Preview/index.js";
import { CodeGroup, CodeTab } from "../CodeGroup/index.js";

/** Authored source tab; code is display text rather than a runtime module. */
export type PreviewFile = {
  /** Tab label, e.g. "Example.tsx". Must be unique within a preview. */
  label: string;
  /** Authored source text displayed in the tab and used for copying when primary. */
  code: string;
  /** Optional grammar override; otherwise inferred from the filename. */
  language?: string;
};

/** [from, to]. Strings replace every occurrence; RegExps use their own flags. */
export type Replacement = [from: string | RegExp, to: string];

/** Live example children and their independently supplied source files. */
export type PreviewCodeProps = {
  /** Preview heading and source group label. @default "Example" */
  title?: string;
  /** The first file is the "primary" one used for the copy button. */
  files: readonly PreviewFile[];
  /** Applied to every file, in order (e.g. rewrite repo-relative imports). */
  replacements?: readonly Replacement[];
  /** Apply the built-in portable source import replacements. */
  replacementPreset?: "portable";
  /** Display the primary source as the preview, without executing it. */
  sourceOnly?: boolean;
  /** Show a button that remounts the rendered example. Defaults to false. */
  refresh?: boolean;
  /** Live example content, supplied independently from the displayed source. */
  children: ReactNode;
  /** Optional application-owned output shown in a separate panel. */
  output?: ReactNode;
  /** Label for the output panel and its toggle. */
  outputLabel?: string;
  /** Initial visibility of the optional output panel. */
  defaultOutputOpen?: boolean;
};

/* ---------- Default replacement ---------- */

/** Default portable import rewrites for displayed documentation snippets. */
export const CODE_REPLACEMENTS: Replacement[] = [
  // any "../../.../src/components/<path>.js" -> "@/components/ui/<path>"
  [/(?:\.\.\/)+src\/components\/([^"']+?)\.js/g, "@/components/ui/$1"],
  // "../setup" or '../setup' -> "./setup" (keeps the original quote style)
  [/(["'])\.\.\/setup\1/g, "$1./setup$1"],
];

/**
 * Render live React children separately from the authored source tabs.
 * Portable replacements affect displayed and copied code only, never the
 * rendered component or its imports. The first file supplies the copy value.
 * @throws If no source files are supplied or labels are duplicated.
 * @example
 * ```tsx
 * <PreviewCode files={[{ label: "Example.tsx", code: "<button>Run</button>" }]}>
 *   <button>Run</button>
 * </PreviewCode>
 * ```
 */
export function PreviewCode({
  title = "Example",
  files,
  replacementPreset,
  replacements = replacementPreset === "portable" ? CODE_REPLACEMENTS : [],
  sourceOnly = false,
  refresh = false,
  children,
  output, outputLabel, defaultOutputOpen,
}: PreviewCodeProps) {
  const [revision, setRevision] = useState(0);
  if (!files.length)
    throw new Error("PreviewCode requires at least one source file.");
  if (new Set(files.map((file) => file.label)).size !== files.length)
    throw new Error("PreviewCode file labels must be unique.");
  const processed = files.map((f) => ({
    ...f,
    code: applyReplacements(f.code, replacements),
  }));
  const primary = processed[0]?.code ?? "";

  return (
    <Preview title={title} source={primary} outputLabel={outputLabel} defaultOutputOpen={defaultOutputOpen}>
      <PreviewHeader>
        <PreviewTitle>{title}</PreviewTitle>
        <PreviewActions>
          {refresh && (
            <PreviewRefreshButton
              onRefresh={() => setRevision((value) => value + 1)}
            />
          )}
          <PreviewCodeToggle />
          <PreviewCopyButton />
          {output != null && <PreviewOutputToggle />}
        </PreviewActions>
      </PreviewHeader>

      <PreviewContent key={revision}>
        {sourceOnly ? (
          <pre>
            <HighlightedCode code={primary} language={processed[0].language ?? previewLanguage(processed[0].label)} />
          </pre>
        ) : children}
      </PreviewContent>

      {processed.length > 1 ? (
        <PreviewSource asChild>
          <div>
            <CodeGroup label={`${title} files`}>
              {processed.map((file) => (
                <CodeTab key={file.label} label={file.label}>
                  <pre>
                    <HighlightedCode
                      code={file.code}
                      language={file.language ?? previewLanguage(file.label)}
                    />
                  </pre>
                </CodeTab>
              ))}
            </CodeGroup>
          </div>
        </PreviewSource>
      ) : (
        <PreviewSource
          code={primary}
          language={
            processed[0].language ?? previewLanguage(processed[0].label)
          }
        />
      )}
      {output != null && <PreviewOutput>{output}</PreviewOutput>}
    </Preview>
  );
}

/** Apply ordered display-only replacements without changing the original source. */
export function applyReplacements(
  code: string,
  replacements: readonly Replacement[],
) {
  return replacements.reduce(
    (acc, [from, to]) =>
      typeof from === "string"
        ? acc.split(from).join(to)
        : acc.replace(from, to),
    code,
  );
}
