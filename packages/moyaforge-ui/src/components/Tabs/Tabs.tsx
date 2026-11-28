import "./Tabs.css";
import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { TabsContext } from "./TabsContext.js";

/** Controlled or uncontrolled selection for a composed tab set. */
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Controlled selected tab value. */
  value?: string;
  /** Initial uncontrolled selected value. @default "" */
  defaultValue?: string;
  /** Called when selection changes. */
  onValueChange?: (value: string) => void;
  /** Tab list and content panels. */
  children: ReactNode;
}
/** Coordinate TabsList, TabsTrigger and TabsContent using matching values. */
export function Tabs({ value, defaultValue = "", onValueChange, children, className, ...props }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const id = useId();
  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    if (next !== (value ?? internal)) onValueChange?.(next);
  };
  return (
    <TabsContext.Provider value={{ value: value ?? internal, select, id }}>
      <div {...props} data-moyaforge-tabs="" className={["mf-tabs", className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}
