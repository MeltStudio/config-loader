export interface ConfigErrorEntry {
  message: string;
  path?: string;
  source?: string;
  kind?:
    | "required"
    | "type_conversion"
    | "invalid_path"
    | "invalid_state"
    | "file_validation";
}

export class ConfigLoadError extends Error {
  public readonly errors: ConfigErrorEntry[];

  public readonly warnings: string[];

  constructor(errors: ConfigErrorEntry[], warnings: string[]) {
    const message = `Configuration loading failed with ${errors.length} error${
      errors.length === 1 ? "" : "s"
    }`;
    super(message);
    this.name = "ConfigLoadError";
    this.errors = errors;
    this.warnings = warnings;
  }
}

export class ConfigFileError extends ConfigLoadError {
  constructor(message: string) {
    super([{ message, kind: "file_validation" }], []);
    this.name = "ConfigFileError";
    this.message = message;
  }
}
