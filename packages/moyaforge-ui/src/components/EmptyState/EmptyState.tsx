import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Optional content for an empty or unavailable result. */
export interface EmptyStateProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "title"
> {
  /** Optional visual indicator. */
  icon?: ReactNode;
  /** Short explanation of the empty state. */
  title?: ReactNode;
  /** Supporting details or next steps. */
  description?: ReactNode;
}

/**
 * Show an empty result, optionally with child actions.
 * @example
 * <EmptyState title="No results" description="Try another search." />
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div data-moyaforge-empty-state="" {...props}>
      {icon}
      {title != null ? <strong>{title}</strong> : null}
      {description != null ? <span>{description}</span> : null}
      {children}
    </div>
  );
}
