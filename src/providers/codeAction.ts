import * as vscode from "vscode";
import { RuleEngine } from "../analyzer/ruleEngine";

export class CodeActionProvider implements vscode.CodeActionProvider {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source === "Go Best Practices") {
        const ruleId = diagnostic.code?.toString();
        if (ruleId) {
          const rule = this.ruleEngine.getRule(ruleId);
          if (rule) {
            // Create fix action
            const fixAction = this.createFixAction(document, diagnostic);
            if (fixAction) {
              actions.push(fixAction);
            }

            // Create disable rule action
            const disableAction = this.createDisableAction(
              document,
              diagnostic,
              rule.getDescription()
            );
            actions.push(disableAction);
          }
        }
      }
    }

    // Add fix all action if there are multiple issues
    if (context.diagnostics.length > 1) {
      const fixAllAction = new vscode.CodeAction(
        "Fix all Go best practice issues",
        vscode.CodeActionKind.QuickFix
      );
      fixAllAction.command = {
        command: "go-best-practices.fixAll",
        title: "Fix all Go best practice issues",
        tooltip: "This will fix all auto-fixable issues in the file",
      };
      actions.push(fixAllAction);
    }

    return actions;
  }

  private createFixAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    // This is a simplified implementation
    // In a real extension, you would use the fixInfo from the rule
    const action = new vscode.CodeAction(
      "Fix this issue",
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();

    // For demonstration, we'll just remove the problematic line
    // In a real extension, you would apply the actual fix from the rule
    action.edit.replace(
      document.uri,
      diagnostic.range,
      "// Fixed: " + document.getText(diagnostic.range).trim()
    );

    return action;
  }

  private createDisableAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    description: string
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Disable rule: ${description}`,
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.command = {
      command: "go-best-practices.disableRule",
      title: "Disable rule",
      arguments: [diagnostic.code],
    };
    return action;
  }
}
