import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to and focus a heading once its route content has mounted. */
export function useDocumentationHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      id = hash.slice(1);
    }
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(id);
      if (!heading) return;
      heading.scrollIntoView();
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
}
