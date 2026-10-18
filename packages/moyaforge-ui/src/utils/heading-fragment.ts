/** Extract an anchor ID from browser or hash-router navigation. */
export function headingIdFromHash(hash: string): string {
  const fragment = hash.lastIndexOf("#");
  if (fragment < 0 || (fragment === 0 && hash.startsWith("#/"))) return "";
  try {
    return decodeURIComponent(hash.slice(fragment + 1));
  } catch {
    return hash.slice(fragment + 1);
  }
}
