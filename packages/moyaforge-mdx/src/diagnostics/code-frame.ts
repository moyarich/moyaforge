/** Render a bounded excerpt from the original authored text, not generated MDX. */
export function createCodeFrame(source: string, line: number, column = 1): string | undefined {
  const lines = source.split(/\r\n|\n|\r/);
  if (!Number.isInteger(line) || line < 1 || line > lines.length) return;
  const start = Math.max(1, line - 2);
  const end = Math.min(lines.length, line + 2);
  const width = String(end).length;
  const frame: string[] = [];
  for (let index = start; index <= end; index++) {
    const text = lines[index - 1];
    const pointer = Math.max(0, Math.min(text.length, column - 1));
    const left = index === line ? Math.max(0, pointer - 100) : 0;
    const prefix = left ? "…" : "";
    const excerpt = text.slice(left, left + 200);
    frame.push(`${index === line ? ">" : " "} ${String(index).padStart(width)} | ${prefix}${excerpt}${text.length > left + 200 ? "…" : ""}`);
    if (index === line) {
      const padding = excerpt.slice(0, pointer - left).replace(/[^\t]/g, " ");
      frame.push(`  ${" ".repeat(width)} | ${prefix ? " " : ""}${padding}^`);
    }
  }
  return frame.join("\n");
}
