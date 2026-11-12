import { CodeXml, Eye } from "lucide-react";
import {
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactElement,
} from "react";
import { usePreview } from "./PreviewContext.js";

export interface PreviewCodeToggleProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "type"
> {
  /** Merge trigger behavior onto one child button or forwardRef button component. */
  asChild?: boolean;
}

/** The child must forward onClick and ARIA props; no extra button is rendered. */
export function PreviewCodeToggle({
  asChild = false,
  children,
  onClick,
  ...props
}: PreviewCodeToggleProps) {
  const { view, setView, contentId } = usePreview();
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) setView(view === "code" ? "preview" : "code");
  };
  const triggerProps = {
    ...props,
    "aria-controls": contentId,
    "aria-expanded": view === "code",
    "data-moyaforge-preview-toggle": "",
    onClick: toggle,
  };
  if (asChild) {
    if (!isValidElement(children) || children.type === Fragment)
      throw new Error(
        "PreviewCodeToggle asChild requires exactly one non-fragment element.",
      );
    const child = children as ReactElement<ComponentPropsWithoutRef<"button">>;
    if (typeof child.type === "string" && child.type !== "button")
      throw new Error(
        "PreviewCodeToggle asChild requires a button or button-like component.",
      );
    return cloneElement(child, {
      ...triggerProps,
      ...child.props,
      "aria-controls": contentId,
      "aria-expanded": view === "code",
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) toggle(event);
      },
    });
  }
  return (
    <button type="button" {...triggerProps}>
      {children ?? (
        <>
          {view === "code" ? (
            <Eye size={15} aria-hidden="true" />
          ) : (
            <CodeXml size={15} aria-hidden="true" />
          )}
          <span>{view === "code" ? "Preview" : "Code"}</span>
        </>
      )}
    </button>
  );
}
