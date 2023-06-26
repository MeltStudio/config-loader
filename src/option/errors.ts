import { injectable } from "inversify";

export interface IOptionErrors {
  registerError(error: string): void;
  registerWarning(warning: string): void;
  clearAllErrors(): void;
  getWarnings(): string[];
  getErrors(): string[];
}

@injectable()
class OptionErrors implements IOptionErrors {
  errors: string[] = [];

  warnings: string[] = [];

  registerError(error: string): void {
    this.errors.push(error);
  }

  registerWarning(warning: string): void {
    this.warnings.push(warning);
  }

  getWarnings(): string[] {
    return this.warnings;
  }

  getErrors(): string[] {
    return this.errors;
  }

  clearAllErrors(): void {
    this.errors = [];
    this.warnings = [];
  }
}

export default OptionErrors;
