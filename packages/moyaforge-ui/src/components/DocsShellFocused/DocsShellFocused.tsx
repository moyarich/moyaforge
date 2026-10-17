import "./DocsShellFocused.css";
import type { ReactNode } from "react";

export interface DocsShellFocusedProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  header?: ReactNode;
  footer?: ReactNode;
  /** Reading-focused shell deliberately does not own navigation or routing. */
  articleActions?: ReactNode;
}

/** Standalone reading experience, not a DocsLayout variant. */
export function DocsShellFocused({
  children,
  title,
  subtitle,
  backHref,
  header,
  footer,
  articleActions,
}: DocsShellFocusedProps) {
  return (
    <div data-moyaforge-shell-focused="">
      <header data-moyaforge-focused-header="">
        {header ?? (
          <div>
            {backHref ? <a href={backHref}>← Back</a> : null}
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        )}
        {articleActions}
      </header>
      <main data-moyaforge-focused-article="">{children}</main>
      {footer ? <footer data-moyaforge-focused-footer="">{footer}</footer> : null}
    </div>
  );
}
