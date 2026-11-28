import "./PreviewFooter.css";
import type { ComponentPropsWithoutRef } from "react";

/** Render the footer slot for supplementary preview content. */
export function PreviewFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-moyaforge-preview-footer=""
      className={["mf-preview-footer", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
