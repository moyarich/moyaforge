import type { Diagnostic } from "./types.js";
import { formatTerminalDiagnostic } from "./formatters/terminal.js";

/** Accumulate diagnostics across source files before deciding whether a build must fail. */
export class DiagnosticCollector {
  private readonly entries: Diagnostic[] = [];

  /** Append a diagnostic in reporting order. */
  add(diagnostic: Diagnostic): void {
    this.entries.push(diagnostic);
  }

  /** Snapshot of all accumulated diagnostics, including warnings. */
  get diagnostics(): readonly Diagnostic[] {
    return [...this.entries];
  }

  /** Number of collected error-level diagnostics. */
  get errorCount(): number {
    return this.entries.filter(entry => entry.severity === "error").length;
  }

  /** Number of collected non-error diagnostics. */
  get warningCount(): number {
    return this.entries.length - this.errorCount;
  }

  /** @throws MdxDiagnosticsError if at least one error was collected; warnings alone do not fail. */
  throwIfErrors(): void {
    if (this.errorCount) throw new MdxDiagnosticsError(this.diagnostics);
  }
}

/** Aggregate error containing all collected diagnostics and a formatted summary. */
export class MdxDiagnosticsError extends Error {
  constructor(public readonly diagnostics: readonly Diagnostic[]) {
    const errors = diagnostics.filter(item => item.severity === "error").length;
    const files = new Set(diagnostics.filter(item => item.severity === "error").map(item => item.location.file)).size;
    super(`${errors} error(s) in ${files} file(s), ${diagnostics.length - errors} warning(s)\n\n${diagnostics.map(formatTerminalDiagnostic).join("\n\n")}`);
    this.name = "MdxDiagnosticsError";
  }
}
