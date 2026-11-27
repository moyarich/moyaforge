import type { Diagnostic } from "./types.js";
import { formatTerminalDiagnostic } from "./formatters/terminal.js";

export class DiagnosticCollector {
  private readonly entries: Diagnostic[] = [];

  add(diagnostic: Diagnostic): void {
    this.entries.push(diagnostic);
  }

  get diagnostics(): readonly Diagnostic[] {
    return [...this.entries];
  }

  get errorCount(): number {
    return this.entries.filter(entry => entry.severity === "error").length;
  }

  get warningCount(): number {
    return this.entries.length - this.errorCount;
  }

  throwIfErrors(): void {
    if (this.errorCount) throw new MdxDiagnosticsError(this.diagnostics);
  }
}

export class MdxDiagnosticsError extends Error {
  constructor(public readonly diagnostics: readonly Diagnostic[]) {
    const errors = diagnostics.filter(item => item.severity === "error").length;
    const files = new Set(diagnostics.filter(item => item.severity === "error").map(item => item.location.file)).size;
    super(`${errors} error(s) in ${files} file(s), ${diagnostics.length - errors} warning(s)\n\n${diagnostics.map(formatTerminalDiagnostic).join("\n\n")}`);
    this.name = "MdxDiagnosticsError";
  }
}
