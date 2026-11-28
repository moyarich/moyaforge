import "./Page.css";
import { createElement, type ElementType, type ReactNode } from "react";

/** Select the rendered element with as and forward its remaining properties. */
export interface PolymorphicProps {
  as?: ElementType;
  children?: ReactNode;
  [key: string]: unknown;
}

/** Render the styled page container; defaults to main, or pass as to choose another element. */
export function Page({ as = "main", children, ...props }: PolymorphicProps) {
  return createElement(as, { ...props, className: ["mf-page", typeof props.className === "string" ? props.className : ""].filter(Boolean).join(" ") }, children);
}
