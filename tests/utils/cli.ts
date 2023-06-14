export function addCliArg(name: string, value: string): void {
  process.argv.push(`--${name}`, value);
}
