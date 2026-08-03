import {access} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function loadOcularConfig(options = {}) {
  const cwd = options.cwd || process.cwd();
  const configPath = options.configPath || path.resolve(cwd, '.ocularrc.js');

  try {
    await access(configPath);
  } catch {
    return {};
  }

  const module = await import(pathToFileURL(configPath).href);
  return module.default || {};
}
