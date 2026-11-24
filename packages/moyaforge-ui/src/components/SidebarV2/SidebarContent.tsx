import "./SidebarContent.css";
import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

export function SidebarContent({
  as = "div",
  children,
  ...props
}: PolymorphicProps) {
  return createElement(
    as,
    {
      ...props,
      className: [
        "mf-sidebar-v2-content",
        typeof props.className === "string" ? props.className : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    children,
  );
}
