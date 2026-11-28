import type { ComponentPropsWithoutRef, ReactNode } from "react";
import "./Card.css";

/** Content and appearance options for a Card; native div props are forwarded. */
export interface CardProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** Optional card heading. */
  title?: ReactNode;
  /** Optional supporting text below the heading. */
  description?: ReactNode;
  /** Visual treatment. @default "outline" */
  variant?: "outline" | "filled" | "ghost";
  /** Reduce the padding and spacing. */
  compact?: boolean;
}

/**
 * A content card for React, Markdown and nested documentation examples.
 * @example
 * <Card title="Getting started" description="Install the package">Read the guide.</Card>
 */
export function Card({
  title,
  description,
  variant = "outline",
  compact = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={["mf-card", `mf-card-${variant}`, compact && "mf-card-compact", className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-compact={compact ? "" : undefined}
    >
      {(title != null || description != null) && (
        <div className="mf-card-header">
          {title != null && <div className="mf-card-title">{title}</div>}
          {description != null && (
            <div className="mf-card-description">{description}</div>
          )}
        </div>
      )}
      {children != null && <div className="mf-card-content">{children}</div>}
    </div>
  );
}
