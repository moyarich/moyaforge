import "./SidebarSection.css";
import { createElement, type ReactNode } from "react";
import type { PolymorphicProps } from "../Page/index.js";

export interface SidebarSectionProps extends PolymorphicProps {
  title?: ReactNode;
  count?: ReactNode;
  header?: ReactNode;
}

export function SidebarSection({
  as = "section",
  title,
  count,
  header,
  children,
  ...props
}: SidebarSectionProps) {
  return createElement(
    as,
    {
      "data-moyaforge-sidebar-section": "",
      ...props,
      className: [
        "mf-sidebar-v2-section",
        typeof props.className === "string" ? props.className : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    header ??
      (title != null ? (
        <header
          className="mf-sidebar-v2-section-header"
          data-moyaforge-sidebar-section-header=""
        >
          <strong>{title}</strong>
          {count != null ? (
            <span
              className="mf-sidebar-v2-count"
              data-moyaforge-sidebar-count=""
            >
              {count}
            </span>
          ) : null}
        </header>
      ) : null),
    children,
  );
}
