import "./EditorContainer.css";
import type { HTMLAttributes } from "react";
export function EditorContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-container", className].filter(Boolean).join(" ")} />;
}
export function EditorToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-toolbar", className].filter(Boolean).join(" ")} />;
}
export function EditorTools({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-tools", className].filter(Boolean).join(" ")} />;
}
export function EditorBreadcrumbs({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav aria-label="File breadcrumbs" {...props} className={["mf-editor-breadcrumbs", className].filter(Boolean).join(" ")} />;
}
export function EditorContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mf-editor-content", className].filter(Boolean).join(" ")} />;
}
