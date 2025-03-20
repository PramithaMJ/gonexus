import * as vscode from "vscode";
import { RuleEngine } from "./analyzer/ruleEngine";
import { DiagnosticsProvider } from "./providers/diagnostics";
import { QuickFixProvider } from "./providers/quickFix";
import { CodeActionProvider } from "./providers/codeAction";
import { loadConfiguration } from "./utils/config";

export function activate(context: vscode.ExtensionContext) {
  console.log("Go Best Practices extension is now active");

  // Load configuration
  const config = loadConfiguration();

  // Initialize the rule engine
  const ruleEngine = new RuleEngine(config);

  // Register providers
  const diagnosticsProvider = new DiagnosticsProvider(ruleEngine);
  const quickFixProvider = new QuickFixProvider(ruleEngine);
  const codeActionProvider = new CodeActionProvider(ruleEngine);

  // Register event handlers
  const diagnosticsCollection =
    vscode.languages.createDiagnosticCollection("go-best-practices");
  context.subscriptions.push(diagnosticsCollection);

  // Listen for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "go") {
        diagnosticsProvider.updateDiagnostics(
          event.document,
          diagnosticsCollection
        );
      }
    })
  );

  // Listen for document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === "go") {
        diagnosticsProvider.updateDiagnostics(document, diagnosticsCollection);
      }
    })
  );

  // Register code action provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "go", scheme: "file" },
      codeActionProvider,
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("go-best-practices.fixAll", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "go") {
        quickFixProvider.fixAllProblems(editor.document);
      }
    })
  );
}

export function deactivate() {
  console.log("Go Best Practices extension is now deactivated");
}
