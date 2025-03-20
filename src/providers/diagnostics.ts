import * as vscode from "vscode";
import { RuleEngine } from "../analyzer/ruleEngine";
import { IProblem } from "../analyzer/analyzer";

export class DiagnosticsProvider {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine;
  }

  updateDiagnostics(
    document: vscode.TextDocument,
    collection: vscode.DiagnosticCollection
  ): void {
    if (document.languageId !== "go") {
      return;
    }

    const documentText = document.getText();
    const problems = this.ruleEngine.analyze(documentText);

    const diagnostics = problems.map((problem) =>
      this.createDiagnostic(document, problem)
    );

    collection.set(document.uri, diagnostics);
  }

  private createDiagnostic(
    document: vscode.TextDocument,
    problem: IProblem
  ): vscode.Diagnostic {
    const range = new vscode.Range(
      problem.line - 1,
      problem.column - 1,
      problem.line - 1,
      document.lineAt(problem.line - 1).text.length
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      problem.message,
      this.getSeverity(problem.severity)
    );

    diagnostic.source = "Go Best Practices";
    diagnostic.code = problem.ruleId;

    return diagnostic;
  }

  private getSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case "error":
        return vscode.DiagnosticSeverity.Error;
      case "warning":
        return vscode.DiagnosticSeverity.Warning;
      case "info":
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }
}
