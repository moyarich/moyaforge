import "./PreviewHeader.css";
import type { ComponentPropsWithoutRef } from "react";

/** Render the preview toolbar containing title and actions. */
export function PreviewHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-moyaforge-preview-toolbar=""
      className={["mf-preview-toolbar", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
