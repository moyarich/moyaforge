import "./DocsShellWide.css";
import type { ReactNode } from "react";

/** Content and optional named slots for the documentation shell. */
export interface DocsShellWideProps {
  /** Main workspace content. */
  children: ReactNode;
  /** Undefined uses the shell default; null removes it. */
  header?: ReactNode;
  /** Optional controls below the header. */
  toolbar?: ReactNode;
  /** Replace the default navigation list; null hides it. */
  navigation?: ReactNode;
  /** Optional right-hand inspector. */
  inspector?: ReactNode;
  /** Optional content below the workspace. */
  footer?: ReactNode;
  /** Text used by the default header. */
  title?: string;
  /** Links used by the default navigation list. */
  navigationItems?: readonly { label: string; href: string }[];
}

/** Independent workspace shell with fully replaceable named slots. */
export function DocsShellWide({
  children,
  header,
  toolbar,
  navigation,
  inspector,
  footer,
  title,
  navigationItems = [],
}: DocsShellWideProps) {
  const defaultHeader = title ? <strong>{title}</strong> : null;
  const defaultNavigation = navigationItems.length ? (
    <nav aria-label="Documentation navigation">
      <ul>
        {navigationItems.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  ) : null;
  const resolvedHeader = header === undefined ? defaultHeader : header;
  const resolvedNavigation =
    navigation === undefined ? defaultNavigation : navigation;

  return (
    <div className="mf-shell-wide">
      {resolvedHeader != null ? (
        <header className="mf-wide-header">{resolvedHeader}</header>
      ) : null}
      {toolbar != null ? (
        <div className="mf-wide-toolbar">{toolbar}</div>
      ) : null}
      <div className="mf-wide-grid">
        {resolvedNavigation != null ? (
          <aside className="mf-wide-navigation">{resolvedNavigation}</aside>
        ) : null}
        <main className="mf-wide-content">{children}</main>
        {inspector != null ? (
          <aside className="mf-wide-inspector">{inspector}</aside>
        ) : null}
      </div>
      {footer != null ? (
        <footer className="mf-wide-footer">{footer}</footer>
      ) : null}
    </div>
  );
}
