import "./CodeGroup.css";
import { Children, isValidElement, useRef, useState, type ReactElement, type ReactNode } from "react";
import { CodeCopyIcon } from "../CodeBlock/CodeCopyIcon.js";
import { CopyButton } from "../CopyButton/CopyButton.js";
import { CodeGroupContext } from "../CodeBlock/CodeBlock.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Tabs/index.js";

export interface CodeTabProps {
  label: string;
  children: ReactNode;
}

export function CodeTab({ children }: CodeTabProps) {
  return <>{children}</>;
}

export interface CodeGroupProps {
  children: ReactNode;
  label?: string;
}

/** File-like code tabs backed by the reusable Tabs primitives. */
export function CodeGroup({ children, label = "Code examples" }: CodeGroupProps) {
  const tabs = Children.toArray(children)
    .filter(
      (child): child is ReactElement<CodeTabProps> =>
        isValidElement(child) && child.type === CodeTab,
    )
    .map(child => ({ label: child.props.label, content: child.props.children }));
  const [selected, setSelected] = useState("0");
  const root = useRef<HTMLDivElement>(null);
  if (!tabs.length) return null;
  const active = Math.min(Number(selected) || 0, tabs.length - 1);
  return (
    <div className="mf-code-group" ref={root}>
      <Tabs value={String(active)} onValueChange={setSelected} className="mf-code-group-tabs">
        <div className="mf-code-toolbar">
          <TabsList aria-label={label} className="mf-code-tabs">
            {tabs.map((tab, index) => (
              <TabsTrigger key={index} value={String(index)} className="mf-code-tab">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <CopyButton
            icon={<CodeCopyIcon />}
            className="mf-code-copy"
            aria-label={`Copy ${tabs[active].label} code`}
            getValue={() => {
              const panel = root.current?.querySelector('[role="tabpanel"]:not([hidden])');
              return panel?.querySelector("pre")?.textContent ?? panel?.textContent ?? "";
            }}
          />
        </div>
        <CodeGroupContext.Provider value={true}>
          {tabs.map((tab, index) => (
            <TabsContent
              key={index}
              value={String(index)}
              forceMount
              className="mf-code-panel"
              data-moyaforge-code-panel=""
            >
              {tab.content}
            </TabsContent>
          ))}
        </CodeGroupContext.Provider>
      </Tabs>
    </div>
  );
}
