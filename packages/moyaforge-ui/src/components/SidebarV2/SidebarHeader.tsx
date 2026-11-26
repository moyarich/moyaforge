import "./SidebarHeader.css";
import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

export function SidebarHeader({
  as = "header",
  children,
  ...props
}: PolymorphicProps) {
  return createElement(
    as,
    {
      ...props,
      className: [
        "mf-sidebar-v2-header",
        typeof props.className === "string" ? props.className : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    children,
  );
}
