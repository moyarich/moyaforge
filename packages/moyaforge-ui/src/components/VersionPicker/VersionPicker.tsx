import "./VersionPicker.css";
import { useId } from "react";
import { ChevronDown } from "lucide-react";

export interface VersionOption {
  label: string;
  value: string;
}

export interface VersionPickerProps {
  versions: readonly VersionOption[];
  current: string;
  label?: string;
  selectLabel?: string;
  className?: string;
  onChange?: (value: string) => void;
}

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
