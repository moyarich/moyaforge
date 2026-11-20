import { type HTMLAttributes, type KeyboardEvent } from "react";
import { useTabs } from "./TabsContext.js";

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
