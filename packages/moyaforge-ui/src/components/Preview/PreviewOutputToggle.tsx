import { SquareTerminal } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { usePreview } from "./PreviewContext.js";

export type PreviewOutputToggleProps = Omit<ComponentPropsWithoutRef<"button">, "type" | "aria-controls" | "aria-expanded">;

/** Toggle the output independently of the source/preview view. */
export function PreviewOutputToggle({ children, className, onClick, ...props }: PreviewOutputToggleProps) {
  const { outputId, outputLabel, outputOpen, setOutputOpen } = usePreview();
  return (
    <button
      {...props}
      type="button"
      className={["mf-preview-action", className].filter(Boolean).join(" ")}
      data-moyaforge-preview-output-toggle=""
      aria-controls={outputId}
      aria-expanded={outputOpen}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) setOutputOpen(!outputOpen);
      }}
    >
      {children ?? <><SquareTerminal size={15} aria-hidden="true" />{outputOpen ? "Hide" : "Show"} {outputLabel}</>}
    </button>
  );
}
