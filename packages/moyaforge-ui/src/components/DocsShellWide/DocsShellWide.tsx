import "./DocsShellWide.css";
import type { ReactNode } from "react";

export interface DocsShellWideProps {
  children: ReactNode;
  header?: ReactNode;
  toolbar?: ReactNode;
  navigation?: ReactNode;
  inspector?: ReactNode;
  footer?: ReactNode;
}

/** Workspace-style documentation shell with independent navigation and inspector panels. */
export function DocsShellWide({
  children,
  header,
  toolbar,
  navigation,
  inspector,
  footer,
}: DocsShellWideProps) {
  return (
    <div data-moyaforge-shell-wide="">
      {header ? <header data-moyaforge-wide-header="">{header}</header> : null}
      {toolbar ? <div data-moyaforge-wide-toolbar="">{toolbar}</div> : null}
      <div data-moyaforge-wide-grid="">
        {navigation ? <aside data-moyaforge-wide-navigation="">{navigation}</aside> : null}
        <main data-moyaforge-wide-content="">{children}</main>
        {inspector ? <aside data-moyaforge-wide-inspector="">{inspector}</aside> : null}
      </div>
      {footer ? <footer data-moyaforge-wide-footer="">{footer}</footer> : null}
    </div>
  );
}
