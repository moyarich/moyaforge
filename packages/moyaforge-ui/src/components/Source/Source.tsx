import { HighlightedCode } from "../HighlightedCode/HighlightedCode.js";
import "./Source.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface SourceProps extends ComponentPropsWithoutRef<"pre"> {
  code?: ReactNode;
  language?: string;
}

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
