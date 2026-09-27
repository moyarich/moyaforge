import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface SourceProps extends ComponentPropsWithoutRef<"pre"> {
  code?: ReactNode;
  language?: string;
}

export function Source({ code, language, children, ...props }: SourceProps) {
  return <pre data-moyaforge-source="" data-language={language} {...props}><code>{children ?? code}</code></pre>;
}
