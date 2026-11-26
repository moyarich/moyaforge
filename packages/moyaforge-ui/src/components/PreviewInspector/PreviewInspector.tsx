import type { ReactNode } from "react";
import "./PreviewInspector.css";

export interface PreviewInspectorProps {
  /** The preview surface, including any viewport controls owned by the caller. */
  children: ReactNode;
  toolbar?: ReactNode;
  inspector?: ReactNode;
  footer?: ReactNode;
  className?: string;
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
