import "./Preview.css";
import {
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { CopyButton } from "../CopyButton/CopyButton.js";

/** Source is supplied by the author or MDX compiler, never extracted from rendered React children. */
export interface PreviewProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  children: ReactNode;
  /** Optional human-readable label for the example. */
  title?: string;
  /** Optional source text to display and copy. */
  source?: string;
  /** Source code language, used as metadata for syntax highlighters. */
  language?: string;
  /** Initial view, defaults to the live example. */
  defaultView?: "preview" | "code";
}

export function Preview({
  children,
  title = "Component preview",
  source,
  language = "tsx",
  defaultView = "preview",
  className,
  ...props
}: PreviewProps) {
  const [view, setView] = useState<"preview" | "code">(
    defaultView === "code" && source !== undefined ? "code" : "preview",
  );
  const id = useId();
  const showCode = source !== undefined && view === "code";
  return (
    <section
      data-moyaforge-preview=""
      data-view={showCode ? "code" : "preview"}
      aria-label={title}
      className={className}
      {...props}
    >
      <div data-moyaforge-preview-toolbar="">
        <span data-moyaforge-preview-title="">{title}</span>
        {source !== undefined && (
          <div data-moyaforge-preview-actions="">
            <button
              type="button"
              aria-controls={id}
              aria-expanded={showCode}
              onClick={() => setView(showCode ? "preview" : "code")}
            >
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyButton value={source} aria-label="Copy example source">
              Copy
            </CopyButton>
          </div>
        )}
      </div>
      <div id={id} data-moyaforge-preview-content="">
        {showCode ? (
          <pre data-moyaforge-preview-source="" data-language={language}>
            <code>{source}</code>
          </pre>
        ) : (
          <div data-moyaforge-preview-stage="">{children}</div>
        )}
      </div>
    </section>
  );
}
