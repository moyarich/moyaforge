import "./TableOfContents.css";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface TableOfContentsItem {
  id: string;
  label: string;
  level: number;
}

export interface TableOfContentsProps extends ComponentPropsWithoutRef<"nav"> {
  /** Precomputed headings from the MDX compiler; avoids DOM discovery. */
  items?: readonly TableOfContentsItem[];
  /** Legacy standalone fallback when items are not provided. */
  root?: ParentNode | null;
  selector?: string;
  renderLink?: (item: TableOfContentsItem) => ReactNode;
}

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
    <nav {...props} aria-label="Table of contents" className={["mf-toc", className].filter(Boolean).join(" ")}>
      <ul>
        {headings.map((heading) => {
          const item = heading;
          return (
            <li key={item.id} data-level={item.level} className={item.level === 3 ? "mf-level-3" : undefined}>
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
