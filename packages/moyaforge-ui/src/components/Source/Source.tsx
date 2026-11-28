import { HighlightedCode } from "../HighlightedCode/HighlightedCode.js";
import "./Source.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Source text or custom React content and optional syntax grammar. */
export interface SourceProps extends ComponentPropsWithoutRef<"pre"> {
  /** Source content used when children are absent. */
  code?: ReactNode;
  /** Grammar name for string content; defaults to text. */
  language?: string;
}

/** Display source code without executing it; string content is highlighted and children take precedence over code. */
export function Source({ code, language, children, className, ...props }: SourceProps) {
  const content = children ?? code;
  return (
    <pre {...props} className={["mf-source", className].filter(Boolean).join(" ")} data-language={language}>
      {typeof content === "string" ? (
        <HighlightedCode code={content} language={language ?? "text"} />
      ) : (
        <code>{content}</code>
      )}
    </pre>
  );
}
