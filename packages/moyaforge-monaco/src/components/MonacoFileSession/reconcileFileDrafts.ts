/**
 * Preserve local drafts unless the host explicitly changes a file's value.
 * @param current - Current drafts keyed by file name.
 * @param previousValues - Last observed host values.
 * @param files - Current host files; removed files are omitted from the result.
 * @returns Updated drafts keyed by current file names.
 */
export function reconcileFileDrafts(
  current: Readonly<Record<string, string>>,
  previousValues: ReadonlyMap<string, string>,
  files: readonly { name: string; value: string }[],
): Record<string, string> {
  return Object.fromEntries(
    files.map((file) => [
      file.name,
      previousValues.get(file.name) !== file.value || !(file.name in current)
        ? file.value
        : current[file.name],
    ]),
  );
}
