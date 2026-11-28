import type { Diagnostic } from "../types.js";

// Escape workflow commands so authored text cannot inject additional commands.
const escapeData = (value: string) => value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
const escapeProperty = (value: string) => escapeData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");

/**
 * Format a diagnostic as a GitHub Actions workflow annotation.
 * Escapes command data and properties so authored text cannot inject workflow commands.
 * @param diagnostic - Structured diagnostic with file and optional source range.
 * @returns Escaped workflow command suitable for writing to CI logs.
 */
export function formatGitHubActionsDiagnostic(diagnostic: Diagnostic): string {
  const { location, severity, code, message, suggestion } = diagnostic;
  const properties = [
    `file=${escapeProperty(location.file)}`,
    `title=${escapeProperty(code)}`,
    location.line && `line=${location.line}`,
    location.column && `col=${location.column}`,
    location.endLine && `endLine=${location.endLine}`,
    location.endColumn && `endColumn=${location.endColumn}`,
  ].filter(Boolean).join(",");
  return `::${severity} ${properties}::${escapeData(message + (suggestion ? "\nSuggestion: " + suggestion : ""))}`;
}
