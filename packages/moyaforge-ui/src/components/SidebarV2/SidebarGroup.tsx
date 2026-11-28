import "./SidebarGroup.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Controlled disclosure state, heading, count and optional custom trigger. */
export interface SidebarGroupProps extends ComponentPropsWithoutRef<"div"> {
  /** Group heading. */
  label: ReactNode;
  /** Optional count next to the label. */
  count?: ReactNode;
  /** Controlled visibility of the children. @default true */
  expanded?: boolean;
  /** Called when the default trigger is clicked; update expanded in the host. */
  onToggle?: () => void;
  /** Optional icon before the label. */
  icon?: ReactNode;
  /** Replace the default disclosure button; preserve accessible disclosure behavior. */
  renderTrigger?: (trigger: {
    label: ReactNode;
    count?: ReactNode;
    expanded: boolean;
    icon?: ReactNode;
    onToggle?: () => void;
  }) => ReactNode;
}

/** Render a collapsible group; update expanded in the host when onToggle is called. */
export function SidebarGroup({
  label,
  count,
  expanded = true,
  onToggle,
  icon,
  children,
  renderTrigger,
  ...props
}: SidebarGroupProps) {
  const trigger = { label, count, expanded, icon, onToggle };
  return (
    <div
      data-moyaforge-sidebar-group=""
      {...props}
      className={["mf-sidebar-v2-group", props.className]
        .filter(Boolean)
        .join(" ")}
    >
      {renderTrigger ? (
        renderTrigger(trigger)
      ) : (
        <button
          className="mf-sidebar-v2-group-trigger"
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {icon}
          <span className="mf-sidebar-v2-group-label">{label}</span>
          {count != null ? (
            <span className="mf-sidebar-v2-count">{count}</span>
          ) : null}
        </button>
      )}
      {expanded ? (
        <div
          className="mf-sidebar-v2-children"
          data-moyaforge-sidebar-children=""
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
