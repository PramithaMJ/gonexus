import { IAnalyzer, IProblem } from "./analyzer";
import { BaseRule } from "../rules/baseRule";
import { NamingRules } from "../rules/naming";
import { ErrorRules } from "../rules/error";
import { FormattingRules } from "../rules/formatting";

export class RuleEngine implements IAnalyzer {
  private rules: BaseRule[] = [];

  constructor(config: any) {
    // Initialize rules based on configuration
    this.initializeRules(config);
  }

  private initializeRules(config: any): void {
    // Add rule instances
    this.rules.push(new NamingRules(config.naming));
    this.rules.push(new ErrorRules(config.error));
    this.rules.push(new FormattingRules(config.formatting));

    // Additional rules can be added here in the future
  }

  analyze(document: string): IProblem[] {
    let problems: IProblem[] = [];

    for (const rule of this.rules) {
      if (rule.isEnabled()) {
        const ruleProblems = rule.check(document);
        problems = problems.concat(ruleProblems);
      }
    }

    return problems;
  }

  getRule(ruleId: string): BaseRule | undefined {
    return this.rules.find((rule) => rule.getId() === ruleId);
  }

  getAllRules(): BaseRule[] {
    return this.rules;
  }
}
