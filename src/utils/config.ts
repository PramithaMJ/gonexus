import * as vscode from "vscode";

export interface BestPracticesConfig {
  naming: {
    enabled: boolean;
    severity: "error" | "warning" | "info";
    packageNameRegex?: string;
    functionNameRegex?: string;
    variableNameRegex?: string;
  };
  error: {
    enabled: boolean;
    severity: "error" | "warning" | "info";
  };
  formatting: {
    enabled: boolean;
    severity: "error" | "warning" | "info";
    maxLineLength?: number;
  };
}

export function loadConfiguration(): BestPracticesConfig {
  const config = vscode.workspace.getConfiguration("goBestPractices");

  return {
    naming: {
      enabled: config.get("naming.enabled", true),
      severity: config.get("naming.severity", "warning"),
      packageNameRegex: config.get("naming.packageNameRegex"),
      functionNameRegex: config.get("naming.functionNameRegex"),
      variableNameRegex: config.get("naming.variableNameRegex"),
    },
    error: {
      enabled: config.get("error.enabled", true),
      severity: config.get("error.severity", "warning"),
    },
    formatting: {
      enabled: config.get("formatting.enabled", true),
      severity: config.get("formatting.severity", "info"),
      maxLineLength: config.get("formatting.maxLineLength", 100),
    },
  };
}
