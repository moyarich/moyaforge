import "./Demo.css";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Wrap a rendered example in the standard demo container; native div props are forwarded.
 * @example
 * <Demo><button>Try me</button></Demo>
 */
export function Demo({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props} data-moyaforge-demo="" className={["mf-demo", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
