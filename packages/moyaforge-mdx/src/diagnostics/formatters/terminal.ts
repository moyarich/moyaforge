import type { Diagnostic } from "../types.js";

/**
 * Format a diagnostic for human-readable terminal output.
 * @param diagnostic - Structured diagnostic including optional frame, suggestions and related locations.
 * @returns Multiline diagnostic text without terminal color codes.
 */
export function formatTerminalDiagnostic(diagnostic: Diagnostic): string {
  const { location, code, phase, message, severity, plugin, directive, attribute, expected, suggestion, related, frame } = diagnostic;
  const position = location.line === undefined ? "" : `:${location.line}${location.column === undefined ? "" : `:${location.column}`}`;
  return [
    `${location.file}${position}: ${severity} [${code}] ${message}`,
    `Phase: ${phase}${plugin ? ` | Plugin: ${plugin}` : ""}${directive ? ` | Directive: ${directive}` : ""}${attribute ? ` | Attribute: ${attribute}` : ""}`,
    frame,
    expected && `Expected: ${expected}`,
    suggestion && `Suggestion: ${suggestion}`,
    ...(related ?? []).map(item => `Related: ${item.file}${item.line ? `:${item.line}` : ""}`),
  ].filter(Boolean).join("\n");
}
