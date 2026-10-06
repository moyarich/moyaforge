import type { ComponentPropsWithoutRef } from "react";

export interface CopyButtonProps extends ComponentPropsWithoutRef<"button"> {
  value?: unknown;
  onCopy?: () => void;
}

export function CopyButton({ value, children = "Copy", onCopy, ...props }: CopyButtonProps) {
  async function copy() {
    await navigator.clipboard.writeText(String(value ?? ""));
    onCopy?.();
  }

  return <button type="button" data-moyaforge-copy-button="" onClick={copy} {...props}>{children}</button>;
}
