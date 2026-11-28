import "./PreviewTitle.css";
import type { ComponentPropsWithoutRef } from "react";

/** Render the title slot in the preview toolbar. */
export function PreviewTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-moyaforge-preview-title=""
      className={["mf-preview-title", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
