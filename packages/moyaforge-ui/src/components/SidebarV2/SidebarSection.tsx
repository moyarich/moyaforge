import "./SidebarSection.css";
import { createElement, type ReactNode } from "react";
import type { PolymorphicProps } from "../Page/index.js";

/** Section heading, count or custom header with polymorphic attributes. */
export interface SidebarSectionProps extends PolymorphicProps {
  /** Default section heading. */
  title?: ReactNode;
  /** Optional count beside the default heading. */
  count?: ReactNode;
  /** Custom heading content; takes precedence over title and count. */
  header?: ReactNode;
}

/** Group sidebar content beneath a heading or caller-provided header. */
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
