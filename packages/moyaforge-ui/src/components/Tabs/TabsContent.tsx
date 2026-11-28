import "./TabsContent.css";
import { type HTMLAttributes } from "react";
import { useTabs } from "./TabsContext.js";
/** Panel identity and optional preservation of inactive content. */
export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Value matching a TabsTrigger. */
  value: string;
  /** Keep inactive content mounted but hidden. @default false */
  forceMount?: boolean;
}
/** Render the panel associated with a trigger value; inactive content is unmounted unless forceMount is set. */
export function TabsContent({ value, forceMount = false, children, className, ...props }: TabsContentProps) {
  const tabs = useTabs();
  const active = tabs.value === value;
  if (!active && !forceMount) return null;
  const key = encodeURIComponent(value);
  return <div {...props} role="tabpanel" id={`${tabs.id}-panel-${key}`} aria-labelledby={`${tabs.id}-tab-${key}`}
    hidden={!active} tabIndex={0} className={["mf-tabs-content", className].filter(Boolean).join(" ")}>{children}</div>;
}
