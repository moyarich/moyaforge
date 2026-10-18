import type { HTMLAttributes, ReactNode } from "react";
import "./CustomBlock.css";

export interface CustomBlockProps extends HTMLAttributes<HTMLDivElement> {
  /** Arbitrary semantic admonition type, supplied by the directive parser. */
  type?: string;
  title?: ReactNode;
  "data-type"?: string;
}

/** A replaceable renderer for every ::: custom-block type. */
export function CustomBlock({
  type,
  title,
  className,
  children,
  ...props
}: CustomBlockProps) {
  const normalized = type?.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const safeType = normalized
    ? /^[a-z_]/.test(normalized)
      ? normalized
      : `type-${normalized}`
    : undefined;
  const classes = new Set([
    "custom-block",
    ...(safeType ? [safeType] : []),
    ...(className ?? "").split(/\s+/).filter(Boolean),
  ]);
  return (
    <div
      {...props}
      data-type={props["data-type"] ?? safeType}
      className={[...classes].join(" ")}
    >
      {title != null && title !== "" && (
        <p className="custom-block-title">{title}</p>
      )}
      {children}
    </div>
  );
}
