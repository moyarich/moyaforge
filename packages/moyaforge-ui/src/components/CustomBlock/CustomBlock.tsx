import type { HTMLAttributes, ReactNode } from "react";
import "./CustomBlock.css";

/** Semantic callout options and native div attributes. */
export interface CustomBlockProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Arbitrary semantic admonition type, supplied by the directive parser. */
  type?: string;
  /** Optional heading displayed above the body. */
  title?: ReactNode;
  /** Override the data attribute used for the semantic type. */
  "data-type"?: string;
}

/**
 * Render a semantic documentation callout, including custom directive types.
 * @example
 * <CustomBlock type="warning" title="Before you continue">Back up your files.</CustomBlock>
 */
export function CustomBlock({
  type,
  title,
  className,
  children,
  ...props
}: CustomBlockProps) {
  // The MDX compiler supplies a canonical directive type.
  // Standalone consumers may also pass a pre-normalized type.
  const classes = new Set([
    "custom-block",
    ...(type ? [type] : []),
    ...(className ?? "").split(/\s+/).filter(Boolean),
  ]);
  return (
    <div
      {...props}
      data-type={props["data-type"] ?? type}
      className={[...classes].join(" ")}
    >
      {title != null && title !== "" && (
        <p className="custom-block-title">{title}</p>
      )}
      {children}
    </div>
  );
}
