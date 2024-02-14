/** @typedef {import('ocular-dev-tools').OcularConfig} OcularConfig */

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const devModules = join(packageRoot, 'dev-modules');
const testDir = join(packageRoot, 'test');

/** @type {OcularConfig} */
const config = {
  babel: false,

  lint: {
    paths: ['modules'], // , 'docs', 'test', 'examples'],
    extensions: ['js', 'ts']
  },

  typescript: {
    project: 'tsconfig.build.json'
  },

  aliases: {
    // DEV MODULES
    'dev-modules': devModules,

    // TEST
    test: testDir
  },

  bundle: {
    globalName: 'luma',
    externals: [],
    target: ['supports webgl', 'not dead'],
    format: 'umd',
    globals: {
      '@luma.gl/*': 'globalThis.luma'
    }
  },

  entry: {
    test: 'test/index.ts',
    'test-browser': 'test/browser.ts',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};

export default config;