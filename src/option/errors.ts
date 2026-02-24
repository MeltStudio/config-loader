import type { ConfigErrorEntry } from "@/errors";
import { clearFileCache } from "@/fileLoader";

export default class OptionErrors {
  public static errors: ConfigErrorEntry[] = [];

  public static warnings: string[] = [];

  public static clearAll(): void {
    OptionErrors.errors = [];
    OptionErrors.warnings = [];
    clearFileCache();
  }
}
