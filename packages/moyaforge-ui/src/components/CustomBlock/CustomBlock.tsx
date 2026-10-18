import type { HTMLAttributes } from "react";
import "./CustomBlock.css";

export interface CustomBlockProps extends HTMLAttributes<HTMLDivElement> {
  /** Directive type emitted by the Markdown parser, e.g. "warning". */
  "data-type"?: string;
}

/**
 * Styling-neutral wrapper for ::: custom blocks.
 * The Markdown compiler supplies the directive type and optional title markup.
 * Nested blocks and components such as CodeGroup remain ordinary children.
 */
export function CustomBlock({
  className,
  children,
  ...props
}: CustomBlockProps) {
  const classes = new Set(["custom-block", ...(className ?? "").split(/\s+/).filter(Boolean)]);
  return (
    <div {...props} className={[...classes].join(" ")}>
      {children}
    </div>
  );
}
