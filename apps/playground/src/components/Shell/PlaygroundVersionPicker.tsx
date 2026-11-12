import { VersionPicker } from "../../../../../packages/moyaforge-ui/src/components/VersionPicker/index.ts";
import { version } from "../../../../../packages/moyaforge/package.json";

interface VersionOption {
  label: string;
  value: string;
  href?: string;
}

export function PlaygroundVersionPicker({
  versions = [{ label: `v${version} (current)`, value: version }],
  current = version,
}: {
  versions?: readonly VersionOption[];
  current?: string;
}) {
  return (
    <VersionPicker
      className="playground-version-picker"
      versions={versions}
      current={current}
      onChange={(value) => {
        const target = versions.find((item) => item.value === value);
        if (target?.href) window.location.assign(target.href);
      }}
    />
  );
}
