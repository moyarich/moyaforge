import "./ResizablePanel.css";
import { resizePanelPair } from "./resize-panel-pair.js";
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type CSSProperties,
} from "react";

interface PanelContext {
  /** Panel arrangement. @default "horizontal" */
  direction: "horizontal" | "vertical";
  sizes: Record<string, number>;
  resize: (sizes: Record<string, number>) => void;
}
const PanelContext = createContext<PanelContext | null>(null);
function usePanels() {
  const context = useContext(PanelContext);
  if (!context)
    throw new Error(
      "ResizablePanel and ResizableHandle require ResizablePanelGroup.",
    );
  return context;
}
/** Layout orientation and optional callback for percentage sizes keyed by panel ID. */
export interface ResizablePanelGroupProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
  /** Receives updated sizes by panel ID after resizing. */
  onLayoutChange?: (sizes: Record<string, number>) => void;
}
/** Direct children should alternate panels and handles. Sizes are percentages. */
export function ResizablePanelGroup({
  direction = "horizontal",
  onLayoutChange,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  return (
    <PanelContext.Provider
      value={{
        direction,
        sizes,
        resize(next) {
          setSizes(next);
          onLayoutChange?.(next);
        },
      }}
    >
      <div
        {...props}
        className={[
          "mf-resizable-group",
          `mf-resizable-group-${direction}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </PanelContext.Provider>
  );
}
/** Initial and allowed panel sizes in percentages. */
export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Initial size in percent. @default 50 */
  defaultSize?: number;
  /** Minimum size in percent. @default 0 */
  minSize?: number;
  /** Maximum size in percent. @default 100 */
  maxSize?: number;
}
/** Place a panel directly inside ResizablePanelGroup; sizes must satisfy 0 ≤ minSize ≤ defaultSize ≤ maxSize ≤ 100. */
export function ResizablePanel({
  defaultSize = 50,
  minSize = 0,
  maxSize = 100,
  id,
  style,
  className,
  ...props
}: ResizablePanelProps) {
  const context = usePanels();
  const generatedId = useId();
  const panelId = id ?? generatedId;
  if (!(
    minSize >= 0 &&
    maxSize <= 100 &&
    minSize <= defaultSize &&
    defaultSize <= maxSize
  ))
    throw new Error(
      "Panel sizes must satisfy 0 ≤ minSize ≤ defaultSize ≤ maxSize ≤ 100.",
    );
  return (
    <div
      {...props}
      id={panelId}
      data-panel-min={minSize}
      data-panel-max={maxSize}
      className={["mf-resizable-panel", className].filter(Boolean).join(" ")}
      style={
        {
          ...style,
          flexGrow: context.sizes[panelId] ?? defaultSize,
          flexBasis: 0,
        } as CSSProperties
      }
    />
  );
}
/** Native separator attributes and an accessible name. */
export interface ResizableHandleProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible name describing the panels being resized. */
  "aria-label"?: string;
}
/** Resize the two adjacent panels with pointer or keyboard input; place between direct panel siblings. */
export function ResizableHandle({
  className,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: ResizableHandleProps) {
  const context = usePanels();
  const drag = useRef<{
    start: number;
    first: number;
    second: number;
    total: number;
    before: HTMLElement;
    after: HTMLElement;
  } | null>(null);
  const horizontal = context.direction === "horizontal";
  function measure(handle: HTMLElement) {
    const before = handle.previousElementSibling as HTMLElement | null;
    const after = handle.nextElementSibling as HTMLElement | null;
    if (
      !before?.classList.contains("mf-resizable-panel") ||
      !after?.classList.contains("mf-resizable-panel")
    )
      return null;
    const panels = Array.from(handle.parentElement!.children).filter((child) =>
      child.classList.contains("mf-resizable-panel"),
    );
    const length = (element: Element) =>
      horizontal
        ? element.getBoundingClientRect().width
        : element.getBoundingClientRect().height;
    const total = panels.reduce((sum, panel) => sum + length(panel), 0);
    if (!total) return null;
    return {
      before,
      after,
      total,
      first: (length(before) / total) * 100,
      second: (length(after) / total) * 100,
    };
  }
  function resize(
    layout: NonNullable<ReturnType<typeof measure>>,
    proposed: number,
  ) {
    const pair = resizePanelPair({
      first: layout.first,
      second: layout.second,
      firstMin: Number(layout.before.dataset.panelMin),
      firstMax: Number(layout.before.dataset.panelMax),
      secondMin: Number(layout.after.dataset.panelMin),
      secondMax: Number(layout.after.dataset.panelMax),
      proposed,
    });
    if (!pair) return;
    const sizes: Record<string, number> = {};
    for (const panel of Array.from(layout.before.parentElement!.children)) {
      if (panel.classList.contains("mf-resizable-panel")) {
        const length = horizontal
          ? panel.getBoundingClientRect().width
          : panel.getBoundingClientRect().height;
        sizes[panel.id] = (length / layout.total) * 100;
      }
    }
    sizes[layout.before.id] = pair[0];
    sizes[layout.after.id] = pair[1];
    context.resize(sizes);
  }
  const handleRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState({
    now: 50,
    min: 0,
    max: 100,
    controls: "",
  });
  useLayoutEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const update = () => {
      const layout = measure(handle);
      if (!layout) return;
      const sum = layout.first + layout.second;
      setValue({
        now: layout.first,
        min: Math.max(
          Number(layout.before.dataset.panelMin),
          sum - Number(layout.after.dataset.panelMax),
        ),
        max: Math.min(
          Number(layout.before.dataset.panelMax),
          sum - Number(layout.after.dataset.panelMin),
        ),
        controls: layout.before.id,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(handle.parentElement!);
    return () => observer.disconnect();
  }, [context.sizes, horizontal]);

  return (
    <div
      {...props}
      ref={handleRef}
      aria-valuenow={Math.round(value.now)}
      aria-valuemin={Math.round(value.min)}
      aria-valuemax={Math.round(value.max)}
      aria-controls={value.controls || undefined}
      role="separator"
      tabIndex={0}
      aria-label={props["aria-label"] ?? "Resize panels"}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      className={["mf-resizable-handle", className].filter(Boolean).join(" ")}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || event.button !== 0) return;
        const layout = measure(event.currentTarget);
        if (!layout) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          ...layout,
          start: horizontal ? event.clientX : event.clientY,
        };
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!drag.current || event.defaultPrevented) return;
        const position = horizontal ? event.clientX : event.clientY;
        const rtl =
          horizontal &&
          getComputedStyle(event.currentTarget).direction === "rtl";
        resize(
          drag.current,
          drag.current.first +
            ((position - drag.current.start) / drag.current.total) *
              100 *
              (rtl ? -1 : 1),
        );
      }}
      onPointerUp={(event) => {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        drag.current = null;
        onPointerCancel?.(event);
      }}
      onLostPointerCapture={(event) => {
        drag.current = null;
        onLostPointerCapture?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const decrease = horizontal ? "ArrowLeft" : "ArrowUp";
        const increase = horizontal ? "ArrowRight" : "ArrowDown";
        if (![decrease, increase, "Home", "End"].includes(event.key)) return;
        const layout = measure(event.currentTarget);
        if (!layout) return;
        event.preventDefault();
        const rtl =
          horizontal &&
          getComputedStyle(event.currentTarget).direction === "rtl";
        const delta =
          (event.key === increase ? 1 : -1) *
          (event.shiftKey ? 10 : 2) *
          (rtl ? -1 : 1);
        resize(
          layout,
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? 100
              : layout.first + delta,
        );
      }}
    />
  );
}
