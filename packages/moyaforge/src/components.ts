import React, {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import type { NavigationItem } from "./navigation.js";
import type { PageDescriptor } from "./content.js";

const h = React.createElement;

type Props = Record<string, unknown>;

export interface CopyButtonProps extends ComponentPropsWithoutRef<"button"> {
  value?: unknown;
  onCopy?: () => void;
}

export function CopyButton({ value, children = "Copy", onCopy, ...props }: CopyButtonProps) {
  async function copy() {
    await navigator.clipboard.writeText(String(value ?? ""));
    onCopy?.();
  }
  return h("button", { type: "button", "data-moyaforge-copy-button": "", onClick: copy, ...props }, children);
}

export interface NavigationTreeProps {
  items: NavigationItem[];
  renderLink?: (page: PageDescriptor, item: NavigationItem) => ReactNode;
  listProps?: ComponentPropsWithoutRef<"ul">;
  itemProps?: ComponentPropsWithoutRef<"li">;
}

export function NavigationTree({ items, renderLink, listProps, itemProps }: NavigationTreeProps) {
  return h("ul", { "data-moyaforge-navigation-tree": "", ...listProps },
    items.map((item) => h("li", { key: item.page?.id ?? item.label, ...itemProps },
      item.page && renderLink ? renderLink(item.page, item) : item.label,
      item.children.length ? h(NavigationTree, { items: item.children, renderLink, listProps, itemProps }) : null,
    )),
  );
}

export interface SourceProps extends ComponentPropsWithoutRef<"pre"> {
  code?: ReactNode;
  language?: string;
}
export function Source({ code, language, children, ...props }: SourceProps) {
  return h("pre", { "data-moyaforge-source": "", "data-language": language, ...props }, h("code", null, children ?? code));
}

export function Demo({ children, ...props }: ComponentPropsWithoutRef<"div">) {
  return h("div", { "data-moyaforge-demo": "", ...props }, children);
}

export interface PolymorphicProps {
  as?: ElementType;
  children?: ReactNode;
  [key: string]: unknown;
}
export function Page({ as = "main", children, ...props }: PolymorphicProps) {
  return h(as, { "data-moyaforge-page": "", ...props }, children);
}

export interface TableOfContentsProps extends ComponentPropsWithoutRef<"nav"> {
  root?: ParentNode | null;
  selector?: string;
  renderLink?: (item: { id: string; label: string; level: number }) => ReactNode;
}
export function TableOfContents({ root = typeof document === "undefined" ? null : document, selector = "h2[id], h3[id]", renderLink, ...props }: TableOfContentsProps) {
  const headings = root ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : [];
  return h("nav", { "data-moyaforge-toc": "", "aria-label": "Table of contents", ...props },
    h("ul", null, headings.map((heading) => {
      const item = { id: heading.id, label: heading.textContent ?? heading.id, level: Number(heading.tagName.slice(1)) };
      return h("li", { key: item.id, "data-level": item.level }, renderLink ? renderLink(item) : h("a", { href: `#${item.id}` }, item.label));
    })),
  );
}

function SidebarRoot({ as = "nav", children, ...props }: PolymorphicProps) {
  return h(as, { "data-moyaforge-sidebar": "", ...props }, children);
}
export function SidebarHeader({ as = "header", children, ...props }: PolymorphicProps) { return h(as, { "data-moyaforge-sidebar-header": "", ...props }, children); }
export function SidebarContent({ as = "div", children, ...props }: PolymorphicProps) { return h(as, { "data-moyaforge-sidebar-content": "", ...props }, children); }
export function SidebarFooter({ as = "footer", children, ...props }: PolymorphicProps) { return h(as, { "data-moyaforge-sidebar-footer": "", ...props }, children); }

export interface SidebarSectionProps extends PolymorphicProps {
  title?: ReactNode;
  count?: ReactNode;
  header?: ReactNode;
}
export function SidebarSection({ as = "section", title, count, header, children, ...props }: SidebarSectionProps) {
  return h(as, { "data-moyaforge-sidebar-section": "", ...props },
    header ?? (title != null ? h("header", { "data-moyaforge-sidebar-section-header": "" }, h("strong", null, title), count != null ? h("span", { "data-moyaforge-sidebar-count": "" }, count) : null) : null),
    children,
  );
}

export interface SearchProps extends ComponentPropsWithoutRef<"label"> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  icon?: ReactNode;
  inputProps?: ComponentPropsWithoutRef<"input">;
}
export function Search({ value, onChange, icon, inputProps, children, ...props }: SearchProps) {
  return h("label", { "data-moyaforge-search": "", ...props }, icon, h("input", { type: "search", value, onChange, ...inputProps }), children);
}

export interface SidebarGroupProps extends ComponentPropsWithoutRef<"div"> {
  label: ReactNode;
  count?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  icon?: ReactNode;
  renderTrigger?: (trigger: { label: ReactNode; count?: ReactNode; expanded: boolean; icon?: ReactNode; onToggle?: () => void }) => ReactNode;
}
export function SidebarGroup({ label, count, expanded = true, onToggle, icon, children, renderTrigger, ...props }: SidebarGroupProps) {
  const trigger = { label, count, expanded, icon, onToggle };
  return h("div", { "data-moyaforge-sidebar-group": "", ...props },
    renderTrigger ? renderTrigger(trigger) : h("button", { type: "button", "aria-expanded": expanded, onClick: onToggle }, icon, h("span", null, label), count != null ? h("span", null, count) : null),
    expanded ? h("div", { "data-moyaforge-sidebar-children": "" }, children) : null,
  );
}

export interface SidebarItemProps extends PolymorphicProps {
  active?: boolean;
  current?: string;
  onSelect?: () => void;
}
export function SidebarItem({ active, current = "page", onSelect, children, as = "button", ...props }: SidebarItemProps) {
  const elementProps: Props = { "aria-current": active ? current : undefined, ...props };
  if (as === "button") {
    elementProps.type ??= "button";
    elementProps.onClick = onSelect;
  }
  return h(as, elementProps, children);
}

export const Sidebar = Object.assign(SidebarRoot, {
  Header: SidebarHeader,
  Content: SidebarContent,
  Section: SidebarSection,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  Item: SidebarItem,
});
