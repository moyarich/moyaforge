import "./SidebarGroup.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface SidebarGroupProps extends ComponentPropsWithoutRef<"div"> {
  label: ReactNode;
  count?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  icon?: ReactNode;
  renderTrigger?: (trigger: {
    label: ReactNode;
    count?: ReactNode;
    expanded: boolean;
    icon?: ReactNode;
    onToggle?: () => void;
  }) => ReactNode;
}

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
