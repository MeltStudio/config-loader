export default class OptionErrors {
  public static errors: string[] = [];

  public static warnings: string[] = [];

  public static clearAll(): void {
    OptionErrors.errors = [];
    OptionErrors.warnings = [];
  }
}
