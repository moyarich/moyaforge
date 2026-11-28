import "./EditPageLink.css";
import type { ComponentPropsWithoutRef } from "react";

/** GitHub repository location and link presentation. */
export interface EditPageLinkProps extends Omit<
  ComponentPropsWithoutRef<"a">,
  "href"
> {
  /** GitHub owner/repo or its full GitHub URL. */
  repository: string;
  /** Repository-relative source filename. */
  path: string;
  /** Branch to edit. @default "main" */
  branch?: string;
  /** Visible link text. @default "Edit this page ↗" */
  label?: string;
}
/**
 * Link to the GitHub editor for a source file; invalid repository/path values render nothing.
 * @example
 * <EditPageLink repository="owner/repo" path="docs/page.mdx" />
 */
export function EditPageLink({
  repository,
  path,
  branch = "main",
  label = "Edit this page ↗",
  className,
  ...props
}: EditPageLinkProps) {
  const cleanRepository = repository
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/^\/+|\/+$/g, "");
  const cleanPath = path.replace(/^\/+/, "");
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(cleanRepository) ||
    !cleanPath ||
    cleanPath.split("/").includes("..")
  )
    return null;
  const href = `https://github.com/${cleanRepository}/edit/${encodeURIComponent(branch)}/${cleanPath.split("/").map(encodeURIComponent).join("/")}`;
  return (
    <a
      className={["mf-edit-page", className].filter(Boolean).join(" ")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {label}
    </a>
  );
}
