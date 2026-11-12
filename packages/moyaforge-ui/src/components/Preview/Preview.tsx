import "./Preview.css";
import {
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import {
  PreviewContext,
  type PreviewState,
  type View,
} from "./PreviewContext.js";
import { PreviewActions } from "./PreviewActions.js";
import { PreviewCodeToggle } from "./PreviewCodeToggle.js";
import { PreviewContent } from "./PreviewContent.js";
import { PreviewCopyButton } from "./PreviewCopyButton.js";
import { PreviewFooter } from "./PreviewFooter.js";
import { PreviewHeader } from "./PreviewHeader.js";
import { PreviewSource } from "./PreviewSource.js";
import { PreviewTitle } from "./PreviewTitle.js";

/** Source is supplied by the caller (or MDX tooling), not extracted from React children. */
export interface PreviewProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  title?: string;
  source?: string;
  language?: string;
  defaultView?: View;
}
export function Preview({
  children,
  title = "Component preview",
  source,
  language = "tsx",
  defaultView = "preview",
  className,
  ...props
}: PreviewProps) {
  const [view, setView] = useState<View>(defaultView);
  const contentId = useId();
  const state: PreviewState = { view, setView, contentId, source };
  const hasSlots = Array.isArray(children)
    ? children.some((child) => isPreviewSlot(child))
    : isPreviewSlot(children);
  return (
    <PreviewContext.Provider value={state}>
      <section
        data-moyaforge-preview=""
        data-view={view}
        aria-label={title}
        className={className}
        {...props}
      >
        {hasSlots ? (
          children
        ) : (
          <>
            <PreviewHeader>
              <PreviewTitle>{title}</PreviewTitle>
              {source !== undefined && (
                <PreviewActions>
                  <PreviewCodeToggle />
                  <PreviewCopyButton />
                </PreviewActions>
              )}
            </PreviewHeader>
            <PreviewContent>{children}</PreviewContent>
            {source !== undefined && (
              <PreviewSource code={source} language={language} />
            )}
          </>
        )}
      </section>
    </PreviewContext.Provider>
  );
}
const slotComponents = new Set<unknown>([
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewContent,
  PreviewSource,
  PreviewFooter,
]);
function isPreviewSlot(value: ReactNode): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    slotComponents.has(value.type)
  );
}

export {
  PreviewActions,
  PreviewCodeToggle,
  PreviewContent,
  PreviewCopyButton,
  PreviewFooter,
  PreviewHeader,
  PreviewSource,
  PreviewTitle,
};
export type { PreviewCodeToggleProps } from "./PreviewCodeToggle.js";
export type { PreviewSourceProps } from "./PreviewSource.js";
