import "./SidebarFooter.css";
import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

/** Render the sidebar footer; defaults to a footer element. */
export function SidebarFooter({
  as = "footer",
  children,
  ...props
}: PolymorphicProps) {
  return createElement(
    as,
    {
      ...props,
      className: [
        "mf-sidebar-v2-footer",
        typeof props.className === "string" ? props.className : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    children,
  );
}
