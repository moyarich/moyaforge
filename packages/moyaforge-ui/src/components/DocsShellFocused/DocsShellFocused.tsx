import "./DocsShellFocused.css";
import type { ReactNode } from "react";

/** Content and optional named slots for the documentation shell. */
export interface DocsShellFocusedProps {
  /** Article body. */
  children: ReactNode;
  /** Default article heading. */
  title?: string;
  /** Supporting text beneath the title. */
  subtitle?: string;
  /** Destination for the default back link. */
  backHref?: string;
  /** Undefined uses the default heading; null intentionally removes it. */
  header?: ReactNode;
  /** Undefined uses the default back link when backHref exists. */
  navigation?: ReactNode;
  /** Undefined or null omits this optional slot. */
  articleActions?: ReactNode;
  /** Optional content below the article. */
  footer?: ReactNode;
}

/** Standalone reading shell with independently replaceable slots. */
export function DocsShellFocused({
  children,
  title,
  subtitle,
  backHref,
  header,
  navigation,
  footer,
  articleActions,
}: DocsShellFocusedProps) {
  const defaultHeader =
    title || subtitle ? (
      <div>
        {title ? <h1>{title}</h1> : null}
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    ) : null;
  const defaultNavigation = backHref ? <a href={backHref}>← Back</a> : null;

  return (
    <div className="mf-shell-focused">
      {(header === undefined ? defaultHeader : header) !== null ||
      (navigation === undefined ? defaultNavigation : navigation) !== null ||
      articleActions != null ? (
        <header className="mf-focused-header">
          {navigation === undefined ? defaultNavigation : navigation}
          {header === undefined ? defaultHeader : header}
          {articleActions}
        </header>
      ) : null}
      <main className="mf-focused-article">{children}</main>
      {footer != null ? (
        <footer className="mf-focused-footer">{footer}</footer>
      ) : null}
    </div>
  );
}
