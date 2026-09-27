import { createElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { PolymorphicProps } from "./Page.js";

export function SidebarHeader({ as = "header", children, ...props }: PolymorphicProps) {
  return createElement(as, { "data-moyaforge-sidebar-header": "", ...props }, children);
}
export function SidebarContent({ as = "div", children, ...props }: PolymorphicProps) {
  return createElement(as, { "data-moyaforge-sidebar-content": "", ...props }, children);
}
export function SidebarFooter({ as = "footer", children, ...props }: PolymorphicProps) {
  return createElement(as, { "data-moyaforge-sidebar-footer": "", ...props }, children);
}

export interface SidebarSectionProps extends PolymorphicProps {
  title?: ReactNode;
  count?: ReactNode;
  header?: ReactNode;
}
export function SidebarSection({ as = "section", title, count, header, children, ...props }: SidebarSectionProps) {
  return createElement(as, { "data-moyaforge-sidebar-section": "", ...props },
    header ?? (title != null ? <header data-moyaforge-sidebar-section-header=""><strong>{title}</strong>{count != null ? <span data-moyaforge-sidebar-count="">{count}</span> : null}</header> : null),
    children,
  );
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
  return <div data-moyaforge-sidebar-group="" {...props}>
    {renderTrigger ? renderTrigger(trigger) : <button type="button" aria-expanded={expanded} onClick={onToggle}>{icon}<span>{label}</span>{count != null ? <span>{count}</span> : null}</button>}
    {expanded ? <div data-moyaforge-sidebar-children="">{children}</div> : null}
  </div>;
}

export interface SidebarItemProps extends PolymorphicProps {
  active?: boolean;
  current?: string;
  onSelect?: () => void;
}
export function SidebarItem({ active, current = "page", onSelect, children, as = "button", ...props }: SidebarItemProps) {
  return createElement(as, {
    "aria-current": active ? current : undefined,
    ...(as === "button" ? { type: "button", onClick: onSelect } : {}),
    ...props,
  }, children);
}

function SidebarRoot({ as = "nav", children, ...props }: PolymorphicProps) {
  return createElement(as, { "data-moyaforge-sidebar": "", ...props }, children);
}

export const Sidebar = Object.assign(SidebarRoot, {
  Header: SidebarHeader,
  Content: SidebarContent,
  Section: SidebarSection,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  Item: SidebarItem,
});
