import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface TableOfContentsItem {
  id: string;
  label: string;
  level: number;
}

export interface TableOfContentsProps extends ComponentPropsWithoutRef<"nav"> {
  root?: ParentNode | null;
  selector?: string;
  renderLink?: (item: TableOfContentsItem) => ReactNode;
}

export function TableOfContents({ root = typeof document === "undefined" ? null : document, selector = "h2[id], h3[id]", renderLink, ...props }: TableOfContentsProps) {
  const headings = root ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : [];

  return (
    <nav data-moyaforge-toc="" aria-label="Table of contents" {...props}>
      <ul>
        {headings.map((heading) => {
          const item = { id: heading.id, label: heading.textContent ?? heading.id, level: Number(heading.tagName.slice(1)) };
          return <li key={item.id} data-level={item.level}>{renderLink ? renderLink(item) : <a href={`#${item.id}`}>{item.label}</a>}</li>;
        })}
      </ul>
    </nav>
  );
}
