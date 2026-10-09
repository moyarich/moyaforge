import { useEffect, useState, type RefObject } from "react";
import type { TableOfContentsItem } from "../TableOfContents/TableOfContents.js";

export interface DocOutlineProps {
  rootRef?: RefObject<HTMLElement | null>;
  selector?: string;
  title?: string;
  className?: string;
}

/** Sticky-ready, scroll-aware outline for an MDX article. Add heading ids in the MDX pipeline. */
export function DocOutline({ rootRef, selector = "h2[id], h3[id]", title = "On this page", className }: DocOutlineProps) {
  const [items, setItems] = useState<TableOfContentsItem[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    const root = rootRef?.current ?? document.querySelector("main");
    if (!root) return;
    const collect = () => setItems(Array.from(root.querySelectorAll<HTMLElement>(selector)).map((node) => ({
      id: node.id, label: node.textContent?.trim() || node.id, level: Number(node.tagName.slice(1)),
    })));
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef, selector]);
  useEffect(() => {
    const update = () => {
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const node = document.getElementById(item.id);
        if (node && node.getBoundingClientRect().top <= 130) current = item.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);
  if (!items.length) return null;
  return <aside data-moyaforge-doc-outline="" className={className} aria-label={title}>
    <p data-moyaforge-doc-outline-title="">{title}</p>
    <nav aria-label={title}><ul>{items.map((item) =>
      <li key={item.id} data-level={item.level}>
        <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>{item.label}</a>
      </li>)}</ul></nav>
  </aside>;
}
