import "./SidebarItem.css";
import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

export interface SidebarItemProps extends PolymorphicProps {
  active?: boolean;
  current?: string;
  onSelect?: () => void;
}

export function SidebarItem({
  active,
  current = "page",
  onSelect,
  children,
  as = "button",
  ...props
}: SidebarItemProps) {
  return createElement(
    as,
    {
      "aria-current": active ? current : undefined,
      ...(as === "button" ? { type: "button", onClick: onSelect } : {}),
      ...props,
      className: [
        "mf-sidebar-v2-item",
        typeof props.className === "string" ? props.className : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    children,
  );
}
