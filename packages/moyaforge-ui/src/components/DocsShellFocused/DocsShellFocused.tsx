import "./DocsShellFocused.css";
import { DocsLayout, type DocsLayoutProps } from "../Layout/DocsLayout/DocsLayout.js";

/** Reading-focused docs shell with an inline outline and no default sidebar. */
export function DocsShellFocused({
  toc,
  ...props
}: DocsLayoutProps) {
  return (
    <div data-moyaforge-shell-focused="">
      <DocsLayout
        {...props}
        sidebar={null}
        outline={null}
        toc={toc === undefined ? false : toc === false ? false : { ...toc, placement: "inline" }}
      />
    </div>
  );
}
