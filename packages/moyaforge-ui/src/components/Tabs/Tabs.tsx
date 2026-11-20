import "./Tabs.css";
import {
  createContext, useContext, useId, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode,
  type KeyboardEvent,
} from "react";

export type TabsVariant = "default" | "workspace";

interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  id: string;
}
const TabsContext = createContext<TabsContextValue | null>(null);
function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be rendered inside Tabs.");
  return context;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  children: ReactNode;
}
export function Tabs({ value, defaultValue = "", onValueChange, variant = "default", children, className, ...props }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const id = useId();
  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    if (next !== (value ?? internal)) onValueChange?.(next);
  };
  return (
    <TabsContext.Provider value={{ value: value ?? internal, select, id }}>
      <div {...props} data-moyaforge-tabs="" data-variant={variant} className={["mf-tabs", className].filter(Boolean).join(" ")}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { select } = useTabs();
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    const next = event.key === "Home" ? 0 :
      event.key === "End" ? tabs.length - 1 :
      event.key === "ArrowRight" ? (index + direction + tabs.length) % tabs.length :
      event.key === "ArrowLeft" ? (index - direction + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    select(tabs[next].dataset.value ?? "");
  }
  return <div {...props} role="tablist" className={["mf-tabs-list", className].filter(Boolean).join(" ")} onKeyDown={handleKeys}>{children}</div>;
}

export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string;
  icon?: ReactNode;
  /** The callback is owned by the application; the tab remains selectable. */
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

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}
export function TabsContent({ value, forceMount = false, children, className, ...props }: TabsContentProps) {
  const tabs = useTabs();
  const active = tabs.value === value;
  if (!active && !forceMount) return null;
  const key = encodeURIComponent(value);
  return <div {...props} role="tabpanel" id={`${tabs.id}-panel-${key}`} aria-labelledby={`${tabs.id}-tab-${key}`}
    hidden={!active} tabIndex={0} className={["mf-tabs-content", className].filter(Boolean).join(" ")}>{children}</div>;
}
