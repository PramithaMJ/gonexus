export interface IAnalyzer {
  analyze(document: string): IProblem[];
}

export interface IProblem {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
  ruleId: string;
  fixInfo?: {
    fixMessage: string;
    replacements: { range: [number, number]; text: string }[];
  };
}
