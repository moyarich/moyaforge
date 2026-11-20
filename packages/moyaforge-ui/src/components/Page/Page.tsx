import "./Page.css";
import { createElement, type ElementType, type ReactNode } from "react";

export interface PolymorphicProps {
  as?: ElementType;
  children?: ReactNode;
  [key: string]: unknown;
}

export function Page({ as = "main", children, ...props }: PolymorphicProps) {
  return createElement(as, { ...props, className: ["mf-page", typeof props.className === "string" ? props.className : ""].filter(Boolean).join(" ") }, children);
}
