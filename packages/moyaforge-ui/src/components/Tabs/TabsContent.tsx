import { type HTMLAttributes } from "react";
import { useTabs } from "./TabsContext.js";
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
