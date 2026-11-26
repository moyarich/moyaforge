/**
 * Create a lowercase URL segment from a title, normalizing accents and word separators.
 * Retains non-Latin letters and digits; removes leading and trailing hyphens.
 * @param title Human-readable page title.
 * @returns A nonempty title-derived ID, without a source or ancestor prefix.
 * @throws {Error} When the title contains no letters or numbers.
 * @example createPageId("Getting started!") // "getting-started"
 */
export function createPageId(title: string): string {
  const id = title
    .trim()
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (!id)
    throw new Error(
      `Page title must contain a letter or number: ${JSON.stringify(title)}`,
    );
  return id;
}
