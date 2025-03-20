import * as vscode from "vscode";
import { RuleEngine } from "../analyzer/ruleEngine";

export class QuickFixProvider {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine;
  }

  async fixAllProblems(document: vscode.TextDocument): Promise<void> {
    const documentText = document.getText();
    const problems = this.ruleEngine.analyze(documentText);

    // Sort problems by position (in reverse to prevent offset issues)
    problems.sort((a, b) => {
      if (a.line === b.line) {
        return b.column - a.column;
      }
      return b.line - a.line;
    });

    const edit = new vscode.WorkspaceEdit();

    for (const problem of problems) {
      if (problem.fixInfo) {
        for (const replacement of problem.fixInfo.replacements) {
          const startPosition = document.positionAt(replacement.range[0]);
          const endPosition = document.positionAt(replacement.range[1]);
          const range = new vscode.Range(startPosition, endPosition);

          edit.replace(document.uri, range, replacement.text);
        }
      }
    }

    await vscode.workspace.applyEdit(edit);
  }
}
