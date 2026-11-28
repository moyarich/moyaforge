import "./TabsTrigger.css";
import { X } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useTabs } from "./TabsContext.js";

/** Tab identity, optional icon and close action, plus native button attributes. */
export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** Unique tab value matching its content panel. */
  value: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Render a close button and call this handler when clicked. */
  onClose?: () => void;
}
/** Select the matching TabsContent panel; optionally render a separate close button. */
export function TabsTrigger({ value, icon, onClose, children, className, onClick, ...props }: TabsTriggerProps) {
  const tabs = useTabs();
  const active = value === tabs.value;
  const key = encodeURIComponent(value);
  return <div className={["mf-tabs-item", active && "mf-tabs-item--active"].filter(Boolean).join(" ")}>
    <button {...props} type="button" role="tab" data-value={value} id={`${tabs.id}-tab-${key}`}
      aria-controls={`${tabs.id}-panel-${key}`} aria-selected={active} tabIndex={active ? 0 : -1}
      className={["mf-tabs-trigger", className].filter(Boolean).join(" ")}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) tabs.select(value); }}>
      {icon}<span>{children}</span>
    </button>
    {onClose && <button type="button" className="mf-tabs-close" aria-label={`Close ${value}`} onClick={onClose}>
      <X size={15} aria-hidden="true" />
    </button>}
  </div>;
}
