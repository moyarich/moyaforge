import type { ComponentPropsWithoutRef } from "react";

export function PreviewHeader(props: ComponentPropsWithoutRef<"div">) {
  return <div data-moyaforge-preview-toolbar="" {...props} />;
}
