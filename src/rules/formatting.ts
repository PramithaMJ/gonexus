import { BaseRule } from "./baseRule";
import { IProblem } from "../analyzer/analyzer";
import * as goParser from "../utils/goParser";

export class FormattingRules extends BaseRule {
  constructor(config: any) {
    super(
      "go-formatting",
      "Go Formatting Practices",
      config?.enabled,
      config?.severity
    );
  }

  check(document: string): IProblem[] {
    const problems: IProblem[] = [];

    // Parse Go code
    const parsedCode = goParser.parseGoCode(document);

    // Check for line length
    for (const line of parsedCode.lines) {
      if (line.text.length > 100) {
        problems.push({
          line: line.number,
          column: 1,
          message:
            "Line exceeds 100 characters. Consider breaking it up for readability.",
          severity: this.severity,
          ruleId: this.id,
        });
      }
    }

    // Check for consistent indentation
    const indentations = parsedCode.lines.map((line) => line.indentation);
    for (let i = 1; i < indentations.length; i++) {
      const diff = Math.abs(indentations[i] - indentations[i - 1]);
      if (diff > 0 && diff != 4) {
        problems.push({
          line: i + 1,
          column: 1,
          message:
            "Inconsistent indentation. Use 4 spaces or tabs consistently.",
          severity: this.severity,
          ruleId: this.id,
        });
      }
    }

    return problems;
  }
}
