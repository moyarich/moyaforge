import { EmptyState } from "../../../../src/components/EmptyState/EmptyState.js";

export default function EmptySearchResults() {
  return (
    <EmptyState
      title="No results"
      description="Try another search or adjust your filters."
    />
  );
}
