import {
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
} from "react";
import { usePreview } from "./PreviewContext.js";

type SlotProps = ComponentPropsWithoutRef<"div"> & { asChild?: boolean };

/** Merge state and DOM attributes onto a single child that forwards DOM props. */
function Slot({ children, asChild, ...props }: SlotProps) {
  if (!asChild) return <div {...props}>{children}</div>;
  if (!isValidElement(children) || children.type === Fragment)
    throw new Error(
      "Preview asChild requires exactly one non-fragment React element.",
    );
  const child = children as ReactElement<ComponentPropsWithoutRef<"div">>;
  return cloneElement(child, {
    ...child.props,
    ...props,
    className:
      [child.props.className, props.className].filter(Boolean).join(" ") ||
      undefined,
    style: { ...child.props.style, ...props.style },
  });
}

export function PreviewContent({
  asChild = false,
  children,
  ...props
}: SlotProps) {
  const { view, contentId } = usePreview();
  return (
    <Slot
      asChild={asChild}
      id={contentId}
      data-moyaforge-preview-content=""
      hidden={view === "code"}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <div data-moyaforge-preview-stage="">{children}</div>
      )}
    </Slot>
  );
}
