import "./PreviewCopyButton.css";
import { Check, CircleAlert, Copy } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { CopyButton } from "../CopyButton/CopyButton.js";
import { usePreview } from "./PreviewContext.js";

export function PreviewCopyButton(
  props: Omit<
    ComponentPropsWithoutRef<typeof CopyButton>,
    "value" | "getValue"
  > & { code?: string },
) {
  const { source } = usePreview();
  const {
    code,
    className,
    children = "Copy",
    icon = (
      <span
        className="mf-preview-copy-icons"
        data-moyaforge-preview-copy-icons=""
        aria-hidden="true"
      >
        <Copy size={15} data-copy-icon="idle" />
        <Check size={15} data-copy-icon="copied" />
        <CircleAlert size={15} data-copy-icon="error" />
      </span>
    ),
    ...rest
  } = props;
  return (
    <CopyButton
      aria-label="Copy example source"
      data-moyaforge-preview-copy=""
      className={["mf-preview-copy", className].filter(Boolean).join(" ")}
      icon={icon}
      {...rest}
      value={code ?? source ?? ""}
    >
      {children}
    </CopyButton>
  );
}
