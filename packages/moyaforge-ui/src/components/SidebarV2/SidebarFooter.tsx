import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

export function SidebarFooter({
  as = "footer",
  children,
  ...props
}: PolymorphicProps) {
  return createElement(
    as,
    { ...props, className: ["mf-sidebar-footer", typeof props.className === "string" ? props.className : ""].filter(Boolean).join(" ") },
    children,
  );
}
