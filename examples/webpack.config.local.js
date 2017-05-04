// This file contains webpack configuration settings that allow
// examples to be built against the deck.gl source code in this repo instead
// of building against their installed version of deck.gl.
//
// This enables using the examples to debug the main deck.gl library source
// without publishing or npm linking, with conveniences such hot reloading etc.

const {resolve} = require('path');

const LIB_DIR = resolve(__dirname, '..');
const SRC_DIR = resolve(LIB_DIR, './dist-es6');

// Support for hot reloading changes to the deck.gl library:
const LOCAL_DEVELOPMENT_CONFIG = {
  resolve: {
    alias: {
      // Imports the deck.gl library from the src directory in this repo
      'luma.gl': SRC_DIR
    }
  },
  module: {
    rules: [
      {
        // Inline shaders
        test: /\.glsl$/,
        loader: 'raw-loader',
        exclude: [/node_modules/]
      },
      {
        // Needed to inline deck.gl GLSL shaders
        include: [SRC_DIR],
        loader: 'transform-loader',
        options: 'brfs-babel'
      }
    ]
  }
};

function addLocalDevSettings(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};
  Object.assign(config.resolve.alias, LOCAL_DEVELOPMENT_CONFIG.resolve.alias);

  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules = config.module.rules.concat(LOCAL_DEVELOPMENT_CONFIG.module.rules);
  return config;
}

module.exports = baseConfig => env => {
  const config = baseConfig;
  if (env && env.local) {
    addLocalDevSettings(config);
  }
  console.log(JSON.stringify(config, null, 2));
  return config;
};
