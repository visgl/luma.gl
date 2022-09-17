const {resolve} = require('path');

module.exports = {
  lint: {
    paths: ['modules', 'dev-modules', 'docs', 'test', 'examples'],
    extensions: ['js']
  },

  aliases: {
    // DEV MODULES
    // TODO - why is each module not listed?
    'dev-modules': resolve(__dirname, './dev-modules'),

    // TEST
    test: resolve(__dirname, './test')
  },

  entry: {
    test: 'test/index.js',
    'test-browser': 'test/browser.js',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};
