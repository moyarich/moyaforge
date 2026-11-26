import { useEffect, useRef, useState, type MouseEvent } from "react";

/** Keep the mobile drawer, body scroll lock, and focus synchronized with navigation. */
export function useMobileNavigation(currentPath?: string) {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setMenu(false), [currentPath]);
  useEffect(() => {
    if (!menu) return;
    const media = window.matchMedia("(max-width: 720px)");
    if (!media.matches) {
      setMenu(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    const closeOnResize = () => {
      if (!media.matches) setMenu(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    media.addEventListener("change", closeOnResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      media.removeEventListener("change", closeOnResize);
    };
  }, [menu]);
  const closeMenu = () => {
    setMenu(false);
    menuButton.current?.focus();
  };
  const closeAfterNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a[href]")) setMenu(false);
  };
  return { menu, setMenu, menuButton, closeMenu, closeAfterNavigation };
}
