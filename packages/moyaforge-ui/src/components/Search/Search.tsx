import "./Search.css";
import { Search as SearchIcon } from "lucide-react";
import type {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

/** Controlled search input options and native label attributes. */
export interface SearchProps extends Omit<
  ComponentPropsWithoutRef<"label">,
  "onChange"
> {
  /** Controlled input text. */
  value?: string;
  /** Receives native input change events. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Leading icon; defaults to a search glyph. */
  icon?: ReactNode;
  /** Additional native input attributes. */
  inputProps?: ComponentPropsWithoutRef<"input">;
}

/** Render a styled search input; pass value and onChange for controlled search. */
export function Search({
  value,
  onChange,
  icon = <SearchIcon aria-hidden="true" focusable="false" />,
  inputProps,
  children,
  className,
  ...props
}: SearchProps) {
  return (
    <label
      {...props}
      data-moyaforge-search=""
      className={["mf-search-control", className].filter(Boolean).join(" ")}
    >
      {icon}
      <input type="search" value={value} onChange={onChange} {...inputProps} />
      {children}
    </label>
  );
}
