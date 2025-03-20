import { IProblem } from "../analyzer/analyzer";

export abstract class BaseRule {
  protected id: string;
  protected description: string;
  protected enabled: boolean;
  protected severity: "error" | "warning" | "info";

  constructor(
    id: string,
    description: string,
    enabled: boolean = true,
    severity: "error" | "warning" | "info" = "warning"
  ) {
    this.id = id;
    this.description = description;
    this.enabled = enabled;
    this.severity = severity;
  }

  abstract check(document: string): IProblem[];

  getId(): string {
    return this.id;
  }

  getDescription(): string {
    return this.description;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getSeverity(): "error" | "warning" | "info" {
    return this.severity;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setSeverity(severity: "error" | "warning" | "info"): void {
    this.severity = severity;
  }
}
