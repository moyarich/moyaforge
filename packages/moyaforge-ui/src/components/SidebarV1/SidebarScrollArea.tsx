import "./SidebarV1.css";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Scroll navigation independently and fade only edges with hidden content. */
export function SidebarScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () =>
      setEdges({
        top: element.scrollTop > 1,
        bottom:
          element.scrollTop + element.clientHeight < element.scrollHeight - 1,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    const mutations = new MutationObserver(update);
    mutations.observe(element, { childList: true, subtree: true });
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      mutations.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <div
      ref={scrollRef}
      className={`mf-sidebar-scroll${edges.top ? " mf-sidebar-fade-top" : ""}${edges.bottom ? " mf-sidebar-fade-bottom" : ""}`}
    >
      <div className="mf-sidebar-scroll-content">{children}</div>
    </div>
  );
}
