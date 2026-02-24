import * as fs from "fs";

import type { EnvFileResult } from "./envFileLoader";
import { loadEnvFile } from "./envFileLoader";
import { ConfigFileError } from "./errors";
import type { ProcessEnv } from "./types";

export function validateFiles(
  files: string | string[] | false | undefined,
  dir: string | false | undefined,
): string | string[] {
  if (files && dir)
    throw new ConfigFileError("Dir and files are specified, choose one");

  let sourceFile: string | string[] = [];

  if (files) {
    if (Array.isArray(files)) {
      const result: string[] = [];
      files.forEach((file) => {
        if (!fs.existsSync(file)) {
          throw new ConfigFileError(`Invalid config file '${file}'`);
        } else {
          result.push(file);
        }
      });
      sourceFile = result;
    } else {
      if (!fs.existsSync(files)) {
        throw new ConfigFileError(`Invalid config file '${files}'`);
      }
      sourceFile = files;
    }
  }

  if (dir) {
    if (!(fs.existsSync(dir) && fs.lstatSync(dir).isDirectory())) {
      throw new ConfigFileError(`'${dir}' not exists or is not a dir`);
    }
    const filesInDirectory = fs.readdirSync(dir).sort();

    if (filesInDirectory.length === 0) {
      throw new ConfigFileError(`Directory '${dir}' is empty`);
    }
    const result: string[] = [];
    filesInDirectory.forEach((file) => {
      result.push(`${dir}/${file}`);
    });
    sourceFile = result;
  }

  return sourceFile;
}

export function loadEnvFiles(
  envFile: string | string[] | false | undefined,
  envData: ProcessEnv,
): { envFileResults: EnvFileResult[]; mergedEnvData: ProcessEnv } {
  const envFileResults: EnvFileResult[] = [];
  if (!envFile) return { envFileResults, mergedEnvData: envData };

  const envFiles = Array.isArray(envFile) ? envFile : [envFile];
  for (const file of envFiles) {
    if (!fs.existsSync(file)) {
      throw new ConfigFileError(`Invalid env file '${file}'`);
    }
    const result = loadEnvFile(file);
    envFileResults.push(result);
  }

  // Merge .env values into envData: .env first, then process.env on top
  const merged: ProcessEnv = {};

  // Apply .env file values (later files override earlier ones)
  for (const result of envFileResults) {
    for (const [key, entry] of result.entries) {
      merged[key] = entry.value;
    }
  }

  // process.env always wins
  for (const [key, value] of Object.entries(envData)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return { envFileResults, mergedEnvData: merged };
}
