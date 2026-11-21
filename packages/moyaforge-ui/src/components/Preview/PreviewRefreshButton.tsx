import { RotateCcw } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { usePreview } from "./PreviewContext.js";

export interface PreviewRefreshButtonProps extends ComponentPropsWithoutRef<"button"> {
  onRefresh: () => void;
}

/** Restart the host's example and return to its rendered preview. */
export function PreviewRefreshButton({
  onRefresh,
  onClick,
  className,
  children,
  ...props
}: PreviewRefreshButtonProps) {
  const { setView } = usePreview();
  return (
    <button
      {...props}
      type="button"
      className={["mf-preview-action", className].filter(Boolean).join(" ")}
      aria-label={props["aria-label"] ?? "Refresh preview"}
      title={props.title ?? "Refresh preview"}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setView("preview");
        onRefresh();
      }}
    >
      <RotateCcw size={16} aria-hidden="true" focusable="false" />
      {children}
    </button>
  );
}
