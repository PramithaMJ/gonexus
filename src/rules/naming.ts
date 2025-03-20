// src/rules/naming.ts
import { BaseRule } from "./baseRule";
import { IProblem } from "../analyzer/analyzer";
import * as goParser from "../utils/goParser";

export class NamingRules extends BaseRule {
  private packageNameRegex: RegExp;
  private functionNameRegex: RegExp;
  private variableNameRegex: RegExp;

  constructor(config: any) {
    super(
      "go-naming",
      "Go Naming Conventions",
      config?.enabled,
      config?.severity
    );

    // Initialize regex patterns based on configuration or use defaults
    this.packageNameRegex = config?.packageNameRegex
      ? new RegExp(config.packageNameRegex)
      : /^[a-z][a-z0-9]*$/;
    this.functionNameRegex = config?.functionNameRegex
      ? new RegExp(config.functionNameRegex)
      : /^[a-zA-Z][a-zA-Z0-9]*$/;
    this.variableNameRegex = config?.variableNameRegex
      ? new RegExp(config.variableNameRegex)
      : /^[a-zA-Z][a-zA-Z0-9]*$/;
  }

  check(document: string): IProblem[] {
    const problems: IProblem[] = [];

    // Parse Go code - simplified for demonstration
    const parsedCode = goParser.parseGoCode(document);

    // Check package names
    for (const pkg of parsedCode.packages) {
      if (!this.packageNameRegex.test(pkg.name)) {
        problems.push({
          line: pkg.line,
          column: pkg.column,
          message: `Package name "${pkg.name}" doesn't follow Go naming conventions. Should be lowercase, single word.`,
          severity: this.severity,
          ruleId: this.id,
          fixInfo: {
            fixMessage: "Rename package according to Go conventions",
            replacements: [
              {
                range: [pkg.nameStart, pkg.nameEnd],
                text: pkg.name.toLowerCase(),
              },
            ],
          },
        });
      }
    }

    // Check function names
    for (const func of parsedCode.functions) {
      if (!this.functionNameRegex.test(func.name)) {
        problems.push({
          line: func.line,
          column: func.column,
          message: `Function name "${func.name}" doesn't follow Go naming conventions. Should be camelCase or PascalCase.`,
          severity: this.severity,
          ruleId: this.id,
        });
      }
    }
    // Additional checks for variables, constants, etc.
    return problems;
  }
}
