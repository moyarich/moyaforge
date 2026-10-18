import "./Preview.css";
import {
  createContext, useContext, useId, useState,
  type ComponentPropsWithoutRef, type ReactNode,
} from "react";
import { CopyButton } from "../CopyButton/CopyButton.js";

type View = "preview" | "code";
interface PreviewState {
  view: View;
  setView: (view: View) => void;
  contentId: string;
  source?: string;
}
const PreviewContext = createContext<PreviewState | null>(null);
function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("Preview slots must be rendered inside <Preview>.");
  return context;
}

/** Source is supplied by the caller (or MDX tooling), not extracted from React children. */
export interface PreviewProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title?: string;
  source?: string;
  language?: string;
  defaultView?: View;
}
export function Preview({
  children, title = "Component preview", source, language = "tsx",
  defaultView = "preview", className, ...props
}: PreviewProps) {
  const [view, setView] = useState<View>(defaultView);
  const contentId = useId();
  const state: PreviewState = { view, setView, contentId, source };
  const hasSlots = Array.isArray(children)
    ? children.some((child) => isPreviewSlot(child))
    : isPreviewSlot(children);
  return (
    <PreviewContext.Provider value={state}>
      <section data-moyaforge-preview="" data-view={view} aria-label={title} className={className} {...props}>
        {hasSlots ? children : (
          <>
            <PreviewHeader>
              <PreviewTitle>{title}</PreviewTitle>
              {source !== undefined && <PreviewActions><PreviewCodeToggle /><PreviewCopyButton /></PreviewActions>}
            </PreviewHeader>
            <PreviewContent>{children}</PreviewContent>
            {source !== undefined && <PreviewSource code={source} language={language} />}
          </>
        )}
      </section>
    </PreviewContext.Provider>
  );
}
const slotComponents = new Set<unknown>();
function isPreviewSlot(value: ReactNode): boolean {
  return typeof value === "object" && value !== null && "type" in value && slotComponents.has(value.type);
}
export function PreviewHeader(props: ComponentPropsWithoutRef<"div">) {
  return <div data-moyaforge-preview-toolbar="" {...props} />;
}
export function PreviewTitle(props: ComponentPropsWithoutRef<"span">) {
  return <span data-moyaforge-preview-title="" {...props} />;
}
export function PreviewActions(props: ComponentPropsWithoutRef<"div">) {
  return <div data-moyaforge-preview-actions="" {...props} />;
}
export function PreviewCodeToggle(props: Omit<ComponentPropsWithoutRef<"button">, "type">) {
  const { view, setView, contentId } = usePreview();
  return (
    <button type="button" aria-controls={contentId} aria-expanded={view === "code"}
      {...props} onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented) setView(view === "code" ? "preview" : "code"); }}>
      {props.children ?? (view === "code" ? "Preview" : "Code")}
    </button>
  );
}
export function PreviewCopyButton(props: Omit<ComponentPropsWithoutRef<typeof CopyButton>, "value" | "getValue"> & { code?: string }) {
  const { source } = usePreview();
  const { code, children = "Copy", ...rest } = props;
  return <CopyButton aria-label="Copy example source" {...rest} value={code ?? source ?? ""}>{children}</CopyButton>;
}
export function PreviewContent(props: ComponentPropsWithoutRef<"div">) {
  const { view, contentId } = usePreview();
  return <div id={contentId} data-moyaforge-preview-content="" hidden={view === "code"} {...props}>
    <div data-moyaforge-preview-stage="">{props.children}</div>
  </div>;
}
export function PreviewSource({ code, language = "tsx", ...props }: Omit<ComponentPropsWithoutRef<"pre">, "children"> & { code: string; language?: string }) {
  const { view } = usePreview();
  return <pre data-moyaforge-preview-source="" data-language={language} hidden={view !== "code"} {...props}><code>{code}</code></pre>;
}
export function PreviewFooter(props: ComponentPropsWithoutRef<"div">) {
  return <div data-moyaforge-preview-footer="" {...props} />;
}
for (const component of [PreviewHeader, PreviewTitle, PreviewActions, PreviewContent, PreviewSource, PreviewFooter]) slotComponents.add(component);
