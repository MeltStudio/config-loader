// taken from https://github.com/joonhocho/tscpaths
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const mapPaths = (paths, mapper) => {
  const dest = {};
  Object.keys(paths).forEach((key) => {
    dest[key] = paths[key].map(mapper);
  });
  return dest;
};

// FIXME: this needs to be improved to handle use cases properly
const getParentFilePath = (child, parent) => {
  // FIXME: add a way to properly check if the parent file is inside node_modules
  // if the parent path is not relative, just return it
  if (!parent.startsWith('./')) {
    return parent;
  }

  // if the child is an absolute path and the parent is relative return the
  // resolved path
  if (child.startsWith('/')) {
    return resolve(dirname(child), parent);
  }

  // FIXME: improve this to get the correct path for all cases
  // if parent is relative and the file is inside node_modules
  const [, ...parts] = child.split('/').reverse();

  return [...parts.reverse(), parent].join('/');
};

export const loadConfig = (file) => {
  const {
    extends: ext,
    compilerOptions: { baseUrl, outDir, paths } = {},
    // eslint-disable-next-line import/no-dynamic-require, global-require
  } = require(file);

  const config = {};
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }
  if (outDir) {
    config.outDir = outDir;
  }
  if (paths) {
    config.paths = paths;
  }

  if (ext) {
    const parentConfig = loadConfig(getParentFilePath(file, ext));
    return {
      ...parentConfig,
      ...config,
    };
  }

  return config;
};
