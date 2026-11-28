import "./TableOfContents.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** A heading link with an anchor ID, label and heading level. */
export interface TableOfContentsItem {
  id: string;
  label: string;
  level: number;
}

/** Precomputed heading links or standalone DOM discovery options. */
export interface TableOfContentsProps extends ComponentPropsWithoutRef<"nav"> {
  /** Precomputed headings from the MDX compiler; avoids DOM discovery. */
  items?: readonly TableOfContentsItem[];
  /** Legacy standalone fallback when items are not provided. */
  root?: ParentNode | null;
  /** CSS selector used for DOM discovery. @default "h2[id], h3[id]" */
  selector?: string;
  /** Override the link for each heading. */
  renderLink?: (item: TableOfContentsItem) => ReactNode;
}

/** Render a table of contents from supplied heading data or matching DOM headings. */
export function TableOfContents({
  items,
  root = typeof document === "undefined" ? null : document,
  selector = "h2[id], h3[id]",
  renderLink,
  className,
  ...props
}: TableOfContentsProps) {
  const headings =
    items ??
    (root
      ? Array.from(root.querySelectorAll<HTMLElement>(selector)).map(
          (heading) => ({
            id: heading.id,
            label: heading.textContent ?? heading.id,
            level: Number(heading.tagName.slice(1)),
          }),
        )
      : []);

  return (
    <nav
      {...props}
      aria-label="Table of contents"
      className={["mf-toc", className].filter(Boolean).join(" ")}
    >
      <ul>
        {headings.map((heading) => {
          const item = heading;
          return (
            <li
              key={item.id}
              data-level={item.level}
              className={`mf-level-${item.level}`}
            >
              {renderLink ? (
                renderLink(item)
              ) : (
                <a href={`#${item.id}`}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
