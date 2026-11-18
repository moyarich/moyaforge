import "./Demo.css";
import type { ComponentPropsWithoutRef } from "react";

export function Demo({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props} data-moyaforge-demo="" className={["mf-demo", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
