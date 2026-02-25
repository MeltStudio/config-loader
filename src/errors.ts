/* eslint-disable max-classes-per-file */

/** A single configuration validation error with optional location metadata. */
export interface ConfigErrorEntry {
  /** Human-readable error description. */
  message: string;
  /** Dot-separated path to the offending config key (e.g. `"db.port"`). */
  path?: string;
  /** The source where the error originated (e.g. file path, `"env"`, `"cli"`). */
  source?: string;
  /** Classification of the error. */
  kind?:
    | "required"
    | "type_conversion"
    | "invalid_path"
    | "invalid_state"
    | "file_validation"
    | "null_value"
    | "strict";
  /** Line number in the config file where the error occurred, if applicable. */
  line?: number;
  /** Column number in the config file where the error occurred, if applicable. */
  column?: number;
}

/** Thrown when configuration loading fails validation. Contains structured error entries and warnings. */
export class ConfigLoadError extends Error {
  /** All validation errors that caused the load to fail. */
  public readonly errors: ConfigErrorEntry[];

  /** Non-fatal warnings collected during loading. */
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

/** Thrown when a configuration file cannot be read or parsed. */
export class ConfigFileError extends ConfigLoadError {
  constructor(message: string) {
    super([{ message, kind: "file_validation" }], []);
    this.name = "ConfigFileError";
    this.message = message;
  }
}
