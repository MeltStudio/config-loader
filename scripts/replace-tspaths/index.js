#! /usr/bin/env node
// taken from https://github.com/joonhocho/tscpaths
const { program } = require('commander');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('globby');
const { dirname, relative, resolve } = require('path');

const { loadConfig } = require('./util');

program
  .version('0.0.1')
  .option('-p, --project <file>', 'path to tsconfig.json', './tsconfig.json')
  .option('-s, --src <path>', 'source root path', './src')
  .option('-o, --out <path>', 'output root path', './dist')
  .option('-v, --verbose', 'output logs');

program.on('--help', () => {
  console.log('\n$ tscpath -p tsconfig.json\n');
});

program.parse();

const { project, src, out, verbose } = program.opts();

if (!project) {
  throw new Error('--project must be specified');
}
if (!src) {
  throw new Error('--src must be specified');
}

const verboseLog = (message) => {
  if (verbose) {
    console.log(message);
  }
};

const configFile = resolve(process.cwd(), project);

const srcRoot = resolve(src);

const outRoot = out && resolve(out);

const { baseUrl, outDir, paths } = loadConfig(configFile);

if (!baseUrl) {
  throw new Error('compilerOptions.baseUrl is not set');
}
if (!paths) {
  throw new Error('compilerOptions.paths is not set');
}
if (!outDir) {
  throw new Error('compilerOptions.outDir is not set');
}
verboseLog(`baseUrl: ${baseUrl}`);
verboseLog(`outDir: ${outDir}`);
verboseLog(`paths: ${JSON.stringify(paths, null, 2)}`);

const configDir = dirname(configFile);

const basePath = resolve(configDir, baseUrl);
verboseLog(`basePath: ${basePath}`);

const outPath = outRoot || resolve(basePath, outDir);
verboseLog(`outPath: ${outPath}`);

const outFileToSrcFile = (x) => resolve(srcRoot, relative(outPath, x));

const aliases = Object.keys(paths)
  .map((alias) => ({
    prefix: alias.replace(/\*$/, ''),
    aliasPaths: paths[alias].map((p) =>
      resolve(basePath, p.replace(/\*$/, ''))
    ),
  }))
  .filter(({ prefix }) => prefix);
verboseLog(`aliases: ${JSON.stringify(aliases, null, 2)}`);

const toRelative = (from, x) => {
  const rel = relative(from, x);
  return (rel.startsWith('.') ? rel : `./${rel}`).replace(/\\/g, '/');
};

const exts = ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.json'];

let replaceCount = 0;

const absToRel = (modulePath, outFile) => {
  const alen = aliases.length;
  for (let j = 0; j < alen; j += 1) {
    const { prefix, aliasPaths } = aliases[j];

    if (modulePath.startsWith(prefix)) {
      const modulePathRel = modulePath.substring(prefix.length);
      const srcFile = outFileToSrcFile(outFile);
      const outRel = relative(basePath, outFile);
      verboseLog(`${outRel} (source: ${relative(basePath, srcFile)}):`);
      verboseLog(`\timport '${modulePath}'`);
      const len = aliasPaths.length;
      for (let i = 0; i < len; i += 1) {
        const apath = aliasPaths[i];
        const moduleSrc = resolve(apath, modulePathRel);
        if (
          existsSync(moduleSrc) ||
          exts.some((ext) => existsSync(moduleSrc + ext))
        ) {
          const rel = toRelative(dirname(srcFile), moduleSrc);
          replaceCount += 1;
          verboseLog(
            `\treplacing '${modulePath}' -> '${rel}' referencing ${relative(
              basePath,
              moduleSrc
            )}`
          );
          return rel;
        }
      }
      console.log(`could not replace ${modulePath}`);
    }
  }
  return modulePath;
};

const requireRegex = /(?:import|require)\(['"]([^'"]*)['"]\)/g;
const importRegex = /(?:import|from) ['"]([^'"]*)['"]/g;

const replaceImportStatement = (orig, matched, outFile) => {
  const index = orig.indexOf(matched);
  return (
    orig.substring(0, index) +
    absToRel(matched, outFile) +
    orig.substring(index + matched.length)
  );
};

const replaceAlias = (text, outFile) =>
  text
    .replace(requireRegex, (orig, matched) =>
      replaceImportStatement(orig, matched, outFile)
    )
    .replace(importRegex, (orig, matched) =>
      replaceImportStatement(orig, matched, outFile)
    );

// import relative to absolute path
const files = sync(`${outPath}/**/*.{js,jsx,ts,tsx}`, {
  dot: true,
  // @ts-expect-error noDir is not on the types
  noDir: true,
}).map((x) => resolve(x));

let changedFileCount = 0;

const flen = files.length;
for (let i = 0; i < flen; i += 1) {
  const file = files[i];
  const text = readFileSync(file, 'utf8');
  const prevReplaceCount = replaceCount;
  const newText = replaceAlias(text, file);
  if (text !== newText) {
    changedFileCount += 1;
    verboseLog(`${file}: replaced ${replaceCount - prevReplaceCount} paths`);
    writeFileSync(file, newText, 'utf8');
  }
}

console.log(`Replaced ${replaceCount} paths in ${changedFileCount} files`);
