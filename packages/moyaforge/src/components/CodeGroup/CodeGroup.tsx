import { Children, isValidElement, useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

export interface CodeTabProps { label: string; children: ReactNode }
export function CodeTab({ children }: CodeTabProps) { return <>{children}</>; }

export interface CodeGroupProps { children: ReactNode; label?: string }
export function CodeGroup({ children, label = "Code examples" }: CodeGroupProps) {
  const tabs = Children.toArray(children)
    .filter((child): child is ReactElement<CodeTabProps> =>
      isValidElement(child) && child.type === CodeTab)
    .map((child) => ({ label: child.props.label, content: child.props.children }));
  const [selected, setSelected] = useState(0);
  const id = useId();
  if (!tabs.length) return null;
  const active = Math.min(selected, tabs.length - 1);
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : event.key === "ArrowRight" ? (active + 1) % tabs.length
      : event.key === "ArrowLeft" ? (active - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    event.preventDefault();
    setSelected(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')[next]?.focus();
  };
  return <div data-moyaforge-code-group="">
    <div role="tablist" aria-label={label} data-moyaforge-code-tabs="">
      {tabs.map((tab, index) => <button type="button" role="tab" key={index}
        id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
        aria-selected={active === index} tabIndex={active === index ? 0 : -1}
        onClick={() => setSelected(index)} onKeyDown={keyDown}>{tab.label}</button>)}
    </div>
    {tabs.map((tab, index) => <div role="tabpanel" key={index}
      id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`}
      hidden={active !== index} data-moyaforge-code-panel="">{tab.content}</div>)}
  </div>;
}
