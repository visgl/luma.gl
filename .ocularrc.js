import {resolve} from 'path';

export default {
  lint: {
    paths: ['modules', 'docs', 'test', 'examples'],
    extensions: ['js', 'ts']
  },

  typescript: {
    project: 'tsconfig.build.json'
  },

  aliases: {
    // DEV MODULES
    'dev-modules': resolve('./dev-modules'),

    // TEST
    test: resolve('./test')
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
