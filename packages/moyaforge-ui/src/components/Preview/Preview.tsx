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
import { PreviewOutput } from "./PreviewOutput.js";
import { PreviewOutputToggle } from "./PreviewOutputToggle.js";
import { PreviewTitle } from "./PreviewTitle.js";

/** Source is supplied by the caller (or MDX tooling), not extracted from React children. */
export interface PreviewProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  /** Visible heading for the shorthand composition. */
  title?: string;
  /** Text used by the source view and copy action. */
  source?: string;
  /** Syntax grammar for the shorthand source view. @default "tsx" */
  language?: string;
  /** Initial live or code view. */
  defaultView?: View;
  /** Optional output for the shorthand composition. */
  output?: ReactNode;
  /** Label for the output region and toggle. */
  outputLabel?: string;
  /** Initial visibility of the output region. */
  defaultOutputOpen?: boolean;
}
/**
 * Coordinate the live view, source view, output and refresh state for preview slots.
 * Source is explicitly supplied by the caller; React children are not serialized.
 */
export function Preview({
  children,
  title = "Component preview",
  source,
  language = "tsx",
  defaultView = "preview",
  output, outputLabel = "Output", defaultOutputOpen = true,
  className,
  ...props
}: PreviewProps) {
  const [view, setView] = useState<View>(defaultView);
  const contentId = useId();
  const outputId = useId();
  const [outputOpen, setOutputOpen] = useState(defaultOutputOpen);
  const state: PreviewState = { view, setView, contentId, source, outputId, outputOpen, setOutputOpen, outputLabel };
  const hasSlots = Array.isArray(children)
    ? children.some((child) => isPreviewSlot(child))
    : isPreviewSlot(children);
  return (
    <PreviewContext.Provider value={state}>
      <section
        data-moyaforge-preview=""
        data-view={view}
        aria-label={title}
        className={["mf-preview", className].filter(Boolean).join(" ")}
        {...props}
      >
        {hasSlots ? (
          children
        ) : (
          <>
            <PreviewHeader>
              <PreviewTitle>{title}</PreviewTitle>
              {(source !== undefined || output != null) && (
                <PreviewActions>
                  {source !== undefined && <><PreviewCodeToggle /><PreviewCopyButton /></>}
                  {output != null && <PreviewOutputToggle />}
                </PreviewActions>
              )}
            </PreviewHeader>
            <PreviewContent>{children}</PreviewContent>
            {source !== undefined && (
              <PreviewSource code={source} language={language} />
            )}
            {output != null && <PreviewOutput>{output}</PreviewOutput>}
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
  PreviewOutput,
  PreviewOutputToggle,
]);
function isPreviewSlot(value: ReactNode): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    slotComponents.has(value.type)
  );
}
