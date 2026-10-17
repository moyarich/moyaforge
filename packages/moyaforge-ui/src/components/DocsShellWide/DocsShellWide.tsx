import "./DocsShellWide.css";
import {
  DocsLayout,
  type DocsLayoutProps,
} from "../Layout/DocsLayout/DocsLayout.js";

/** Wider docs shell for API references and developer guides. */
export function DocsShellWide(props: DocsLayoutProps) {
  return (
    <div data-moyaforge-shell-wide="">
      <DocsLayout {...props} />
    </div>
  );
}
