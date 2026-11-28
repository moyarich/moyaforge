import "./EditorContainer.css";
import type { HTMLAttributes } from "react";
/** Compose a styled editor shell around a toolbar and content region. */
export function EditorContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-container", className].filter(Boolean).join(" ")} />;
}
/** Place file tabs and editor tools in the top toolbar. */
export function EditorToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-toolbar", className].filter(Boolean).join(" ")} />;
}
/** Group editor actions inside EditorToolbar. */
export function EditorTools({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-tools", className].filter(Boolean).join(" ")} />;
}
/** Render file path breadcrumbs in an accessible navigation region. */
export function EditorBreadcrumbs({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav aria-label="File breadcrumbs" {...props} className={["mf-editor-breadcrumbs", className].filter(Boolean).join(" ")} />;
}
/** Wrap the actual editor surface inside EditorContainer. */
export function EditorContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-content", className].filter(Boolean).join(" ")} />;
}
