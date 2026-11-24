import "./TabsList.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { useTabs } from "./TabsContext.js";

/** Opt-in overflow controls for a tab strip. */
export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  tabsScroll?: boolean;
}

export function TabsList({
  children,
  className,
  onKeyDown,
  tabsScroll = false,
  ...props
}: TabsListProps) {
  const { select, value } = useTabs();
  const scroller = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const element = scroller.current;
    if (!element || !tabsScroll) {
      setOverflowing(false);
      setEdges({ left: false, right: false });
      return;
    }

    const update = () => {
      setOverflowing(
        element.scrollWidth >
          (element.parentElement?.clientWidth ?? element.clientWidth) + 1,
      );
      const overflow = Math.max(0, element.scrollWidth - element.clientWidth);
      const position = element.scrollLeft;
      const rtl = getComputedStyle(element).direction === "rtl";
      setEdges({
        left: rtl ? position > -overflow + 1 : position > 1,
        right: rtl ? position < -1 : position < overflow - 1,
      });
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(element);
    if (element.parentElement) observer?.observe(element.parentElement);
    for (const child of element.children) observer?.observe(child);
    window.addEventListener("resize", update);

    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [children, tabsScroll]);

  useEffect(() => {
    const element = scroller.current;
    const selected = Array.from(
      element?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [],
    ).find((tab) => tab.getAttribute("aria-selected") === "true");
    if (!tabsScroll || !element || !selected) return;

    const viewport = element.getBoundingClientRect();
    const tab = selected.getBoundingClientRect();
    const delta =
      tab.left < viewport.left
        ? tab.left - viewport.left
        : tab.right > viewport.right
          ? tab.right - viewport.right
          : 0;
    if (delta !== 0) element.scrollBy({ left: delta, behavior: "auto" });
  }, [value, tabsScroll]);

  const scroll = (direction: -1 | 1) => {
    const element = scroller.current;
    if (!element) return;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollBy({
      left: direction * Math.max(120, element.clientWidth * 0.7),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const direction =
      getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : event.key === "ArrowRight"
            ? (index + direction + tabs.length) % tabs.length
            : event.key === "ArrowLeft"
              ? (index - direction + tabs.length) % tabs.length
              : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    select(tabs[next].dataset.value ?? "");
  }

  return (
    <div
      className={["mf-tabs-list-container", tabsScroll && "mf-tabs-scroll"]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        {...props}
        ref={scroller}
        role="tablist"
        className={[
          "mf-tabs-list",
          tabsScroll && edges.left && "mf-tabs-list--fade-left",
          tabsScroll && edges.right && "mf-tabs-list--fade-right",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={handleKeys}
      >
        {children}
      </div>
      {tabsScroll && overflowing && (
        <button
          type="button"
          className="mf-tabs-scroll-button mf-tabs-scroll-button--left"
          disabled={!edges.left}
          aria-label="Scroll tabs left"
          onClick={() => scroll(-1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      )}
      {tabsScroll && overflowing && (
        <button
          type="button"
          className="mf-tabs-scroll-button mf-tabs-scroll-button--right"
          disabled={!edges.right}
          aria-label="Scroll tabs right"
          onClick={() => scroll(1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
