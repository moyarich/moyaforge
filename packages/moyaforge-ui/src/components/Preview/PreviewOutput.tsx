import "./PreviewOutput.css";
import type { ComponentPropsWithoutRef } from "react";
import { usePreview } from "./PreviewContext.js";

export type PreviewOutputProps = Omit<ComponentPropsWithoutRef<"section">, "id" | "hidden" | "aria-label">;

/** A persistent output region; hiding it does not unmount its children. */
export function PreviewOutput({ className, ...props }: PreviewOutputProps) {
  const { outputId, outputOpen, outputLabel } = usePreview();
  return (
    <section
      {...props}
      id={outputId}
      className={["mf-preview-output", className].filter(Boolean).join(" ")}
      data-moyaforge-preview-output=""
      aria-label={outputLabel}
      hidden={!outputOpen}
    />
  );
}
