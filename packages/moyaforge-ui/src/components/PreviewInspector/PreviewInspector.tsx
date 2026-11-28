import type { ReactNode } from "react";
import "./PreviewInspector.css";

/** Caller-owned preview surface, toolbar, inspector and footer slots. */
export interface PreviewInspectorProps {
  /** The preview surface, including any viewport controls owned by the caller. */
  children: ReactNode;
  /** Optional controls above the preview surface. */
  toolbar?: ReactNode;
  /** Optional side panel for inspecting or editing settings. */
  inspector?: ReactNode;
  /** Optional content below the preview and inspector. */
  footer?: ReactNode;
  /** Additional root class. */
  className?: string;
  /** Accessible name. @default "Inspector preview" */
  label?: string;
}

/** Lay out a preview and its controls while leaving rendering and state to the caller. */
export function PreviewInspector({
  children,
  toolbar,
  inspector,
  footer,
  className,
  label = "Inspector preview",
}: PreviewInspectorProps) {
  return (
    <section
      className={
        className ? `mf-preview-inspector ${className}` : "mf-preview-inspector"
      }
      aria-label={label}
    >
      {toolbar}
      <div className="mf-preview-inspector__body">
        <div className="mf-preview-inspector__surface">{children}</div>
        {inspector != null && (
          <aside
            className="mf-preview-inspector__inspector"
            aria-label="Inspector"
          >
            {inspector}
          </aside>
        )}
      </div>
      {footer}
    </section>
  );
}
