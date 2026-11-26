import { Search } from "../../../../src/components/Search/Search.js";

export default function SearchField() {
  return (
    <Search
      inputProps={{
        placeholder: "Search documentation",
        "aria-label": "Search documentation",
      }}
    >
      <kbd>⌘ K</kbd>
    </Search>
  );
}
