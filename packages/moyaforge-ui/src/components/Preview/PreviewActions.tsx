import "./PreviewActions.css";
import type { ComponentPropsWithoutRef } from "react";

/** Group preview toolbar controls without owning their state. */
export function PreviewActions({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-moyaforge-preview-actions=""
      className={["mf-preview-actions", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
