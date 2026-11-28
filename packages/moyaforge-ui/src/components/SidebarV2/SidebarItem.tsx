import "./SidebarItem.css";
import { createElement } from "react";
import type { PolymorphicProps } from "../Page/index.js";

/** Polymorphic navigation item with active state and selection callback. */
export interface SidebarItemProps extends PolymorphicProps {
  /** Mark the item as the current selection. */
  active?: boolean;
  /** ARIA current token used when active. @default "page" */
  current?: string;
  /** Click callback for the default button; other elements use forwarded props. */
  onSelect?: () => void;
}

/** Render a selectable button by default; use as="a" and href for a link. */
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
