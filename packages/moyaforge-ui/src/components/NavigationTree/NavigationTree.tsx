import "./NavigationTree.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
/** Page metadata associated with a navigation leaf. */
export interface PageDescriptor {
  id: string;
  label: string;
  path: string;
  navPath: string[];
  frontmatter: Record<string, unknown>;
  hidden: boolean;
  Component?: import("react").ComponentType;
}
/** A navigation node with optional page metadata and nested children. */
export interface NavigationItem {
  label: string;
  children: NavigationItem[];
  page?: PageDescriptor;
}

/** Nested navigation items and optional custom link rendering. */
export interface NavigationTreeProps {
  /** Root nodes to render recursively. */
  items: NavigationItem[];
  /** Render a link for a node with page metadata. */
  renderLink?: (page: PageDescriptor, item: NavigationItem) => ReactNode;
  /** Attributes forwarded to each nested list. */
  listProps?: ComponentPropsWithoutRef<"ul">;
  /** Attributes forwarded to each list item. */
  itemProps?: ComponentPropsWithoutRef<"li">;
}

/** Render a recursive navigation list; supply renderLink to make page nodes navigable. */
export function NavigationTree({
  items,
  renderLink,
  listProps,
  itemProps,
}: NavigationTreeProps) {
  return (
    <ul {...listProps} className={["mf-navigation-tree", listProps?.className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <li key={item.page?.id ?? item.label} {...itemProps}>
          {item.page && renderLink ? renderLink(item.page, item) : item.label}
          {item.children.length ? (
            <NavigationTree
              items={item.children}
              renderLink={renderLink}
              listProps={listProps}
              itemProps={itemProps}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
