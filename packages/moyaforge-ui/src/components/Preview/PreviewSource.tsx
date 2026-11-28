import "./PreviewSource.css";
import {
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { HighlightedCode } from "../HighlightedCode/HighlightedCode.js";
import { usePreview } from "./PreviewContext.js";

/** Source slot options, including an optional custom child or raw code string. */
export interface PreviewSourceProps extends Omit<
  ComponentPropsWithoutRef<"pre">,
  "children"
> {
  /** When asChild is enabled, the sole child receives visibility and data attributes. */
  asChild?: boolean;
  children?: ReactNode;
  code?: string;
  language?: string;
}
/** Render the Code view, highlighting supplied text when no custom child is provided. */
export function PreviewSource({
  asChild = false,
  children,
  code,
  language = "tsx",
  className,
  ...props
}: PreviewSourceProps) {
  const { view, source } = usePreview();
  const displayCode = code ?? source ?? "";
  if (asChild) {
    if (!isValidElement(children) || children.type === Fragment)
      throw new Error(
        "PreviewSource asChild requires exactly one non-fragment React element.",
      );
    const child = children as ReactElement<
      ComponentPropsWithoutRef<"pre"> & {
        "data-moyaforge-preview-source"?: string;
        "data-language"?: string;
      }
    >;
    return cloneElement(child, {
      ...child.props,
      ...props,
      "data-moyaforge-preview-source": "",
      className: ["mf-preview-source", child.props.className, className]
        .filter(Boolean)
        .join(" "),
      "data-language": language,
      hidden: view !== "code",
    });
  }
  return (
    <pre
      data-moyaforge-preview-source=""
      className={["mf-preview-source", className].filter(Boolean).join(" ")}
      data-language={language}
      hidden={view !== "code"}
      {...props}
    >
      <HighlightedCode code={displayCode} language={language} />
    </pre>
  );
}
