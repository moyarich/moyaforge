import { LoaderCircle } from "lucide-react";

export function Loading({ label }: { label: string }) {
  return (
    <div className="playground-loading" role="status">
      <LoaderCircle size={16} aria-hidden="true" />
      {label}
    </div>
  );
}
