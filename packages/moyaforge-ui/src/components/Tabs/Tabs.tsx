import "./Tabs.css";
import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { TabsContext } from "./TabsContext.js";

export type TabsVariant = "default" | "workspace";
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
      <div {...props} data-moyaforge-tabs="" data-variant={variant} className={["mf-tabs", className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}
