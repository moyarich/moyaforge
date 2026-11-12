import "./VersionPicker.css";

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
  return (
    <label data-moyaforge-version-picker="" className={className}>
      <span>{label}</span>
      <select
        aria-label={selectLabel}
        value={current}
        disabled={versions.length < 2 || !onChange}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      >
        {versions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
