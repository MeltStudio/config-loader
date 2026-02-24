import { clearEnvFileCache } from "@/envFileLoader";
import type { ConfigErrorEntry } from "@/errors";
import { clearFileCache } from "@/fileLoader";

export default class OptionErrors {
  public errors: ConfigErrorEntry[] = [];

  public warnings: string[] = [];

  public clearAll(): void {
    this.errors = [];
    this.warnings = [];
    clearFileCache();
    clearEnvFileCache();
  }
}
