import "./VersionPicker.css";
import { useId } from "react";
import { ChevronDown } from "lucide-react";

/** Display label and stable value for one documentation version. */
export interface VersionOption {
  /** Visible heading. @default "Documentation" */
  label: string;
  value: string;
}

/** Controlled version selection and optional labels. */
export interface VersionPickerProps {
  /** Available versions in display order. */
  versions: readonly VersionOption[];
  /** Currently selected version value. */
  current: string;
  label?: string;
  /** Accessible name. @default "Documentation version" */
  selectLabel?: string;
  /** Additional root class. */
  className?: string;
  /** Called with the selected value; the host updates current and handles navigation. */
  onChange?: (value: string) => void;
}

/** Display the current version; provide multiple versions and onChange to enable selection. */
export function VersionPicker({
  versions,
  current,
  label = "Documentation",
  selectLabel = "Documentation version",
  className,
  onChange,
}: VersionPickerProps) {
  const id = useId();
  const canSelect = versions.length > 1 && Boolean(onChange);
  const selected = versions.find((version) => version.value === current);
  return (
    <div className={["mf-version-picker", className].filter(Boolean).join(" ")}>
      {canSelect ? (
        <label htmlFor={id} className="mf-version-picker-label">
          {label}
        </label>
      ) : (
        <span className="mf-version-picker-label">{label}</span>
      )}
      {canSelect ? (
        <div className="mf-version-picker-control">
          <select
            id={id}
            aria-label={selectLabel}
            value={current}
            onChange={(event) => onChange?.(event.currentTarget.value)}
          >
            {versions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" focusable="false" />
        </div>
      ) : (
        <span
          className="mf-version-picker-value"
          aria-label={selectLabel}
          title={selected?.label ?? current}
        >
          {selected?.label ?? current}
        </span>
      )}
    </div>
  );
}
