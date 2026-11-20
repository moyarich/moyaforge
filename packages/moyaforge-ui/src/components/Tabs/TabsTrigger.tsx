import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useTabs } from "./TabsContext.js";
export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string;
  icon?: ReactNode;
  onClose?: () => void;
}
export function TabsTrigger({ value, icon, onClose, children, className, onClick, ...props }: TabsTriggerProps) {
  const tabs = useTabs();
  const active = value === tabs.value;
  const key = encodeURIComponent(value);
  return <div className="mf-tabs-item" data-active={active || undefined}>
    <button {...props} type="button" role="tab" data-value={value} id={`${tabs.id}-tab-${key}`}
      aria-controls={`${tabs.id}-panel-${key}`} aria-selected={active} tabIndex={active ? 0 : -1}
      className={["mf-tabs-trigger", className].filter(Boolean).join(" ")}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) tabs.select(value); }}>
      {icon}<span>{children}</span>
    </button>
    {onClose && <button type="button" className="mf-tabs-close" aria-label={`Close ${value}`} onClick={onClose}>×</button>}
  </div>;
}
