import { BaseRule } from "./baseRule";
import { IProblem } from "../analyzer/analyzer";
import * as goParser from "../utils/goParser";

export class ErrorRules extends BaseRule {
  constructor(config: any) {
    super(
      "go-error-handling",
      "Go Error Handling Practices",
      config?.enabled,
      config?.severity
    );
  }

  check(document: string): IProblem[] {
    const problems: IProblem[] = [];

    // Parse Go code
    const parsedCode = goParser.parseGoCode(document);

    // Check for ignored errors
    for (const errorHandle of parsedCode.errorHandling) {
      if (errorHandle.ignored) {
        problems.push({
          line: errorHandle.line,
          column: errorHandle.column,
          message: "Error is being ignored. Always handle errors in Go.",
          severity: this.severity,
          ruleId: this.id,
          fixInfo: {
            fixMessage: "Add proper error handling",
            replacements: [
              {
                range: [errorHandle.start, errorHandle.end],
                text: errorHandle.suggestedFix,
              },
            ],
          },
        });
      }
    }

    // Check for error naming conventions
    for (const errorVar of parsedCode.errorVariables) {
      if (
        errorVar.name !== "err" &&
        !errorVar.name.endsWith("Err") &&
        !errorVar.name.endsWith("Error")
      ) {
        problems.push({
          line: errorVar.line,
          column: errorVar.column,
          message: `Error variable "${errorVar.name}" doesn't follow standard naming conventions. Use "err" or end with "Err"/"Error".`,
          severity: this.severity,
          ruleId: this.id,
        });
      }
    }

    return problems;
  }
}
