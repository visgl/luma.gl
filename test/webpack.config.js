// Copyright (c) 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');

const ALIASES = require(resolve(__dirname, '../aliases'));

const COMMON_CONFIG = {
  mode: 'development',

  stats: {
    warnings: false
  },

  module: {
    rules: []
  },

  plugins: [],

  node: {
    fs: 'empty'
  }
};

const TEST_CONFIG = Object.assign({}, COMMON_CONFIG, {
  devServer: {
    stats: {
      warnings: false
    },
    quiet: true
  },

  // Bundle the tests for running in the browser
  entry: {
    'test-browser': resolve(__dirname, './test-browser.js')
  },

  // Generate a bundle in dist folder
  output: {
    path: resolve('./dist'),
    filename: '[name]-bundle.js'
  },

  devtool: '#source-maps',

  module: {
    rules: [
      {
        // Unfortunately, webpack doesn't import library sourcemaps on its own...
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      }
    ]
  },

  resolve: {
    alias: Object.assign({}, ALIASES)
  },

  plugins: [
    new HtmlWebpackPlugin({title: 'luma.gl tests'})
  ]
});

// Get first key in an object
function getFirstKey(object) {
  for (const key in object) {
    return key;
  }
  return null;
}

// Hack: first key is app
function getApp(env) {
  return getFirstKey(env);
}

function getDist(env) {
  if (env.esm) {
    return 'esm';
  }
  if (env.es5) {
    return 'es5';
  }
  return 'es6';
}

const CONFIGS = {
  test: env => Object.assign({}, TEST_CONFIG, {
    plugins: [new HtmlWebpackPlugin()]
  }),

  bench: env => Object.assign({}, TEST_CONFIG, {
    entry: {
      'test-browser': resolve(__dirname, './bench/browser.js')
    },

    plugins: [new HtmlWebpackPlugin()]
  }),

  size: env => {
    const dist = getDist(env);

    const config = Object.assign({}, TEST_CONFIG, {
      resolve: {
        alias: Object.assign({}, ALIASES, {
          'luma.gl': resolve(__dirname, '../modules/core/')
        })
      }
    });

    switch (dist) {
    case 'es6':
      config.resolve.mainFields = ['esnext', 'browser', 'module', 'main'];
      break;
    case 'es5':
      config.resolve.mainFields = ['browser', 'main'];
      break;
    case 'esm':
    default:
    }
    return config;
  },

  // Bundles a test app for size analysis
  bundle: env => {
    const app = getApp(env);

    const config = CONFIGS.size(env);

    Object.assign(config, {
      mode: env.development ? 'development' : 'production',

      // Replace the entry point for webpack-dev-server
      entry: {
        'test-browser': resolve(__dirname, './size', `${app}.js`)
      },
      output: {
        path: resolve('/tmp'),
        filename: 'bundle.js'
      },
      plugins: [
        // leave minification to app
        // new webpack.optimize.UglifyJsPlugin({comments: false})
        new webpack.DefinePlugin({NODE_ENV: JSON.stringify('production')}),
        new UglifyJsPlugin()
      ]
    });

    delete config.devtool;
    return config;
  },

  // Bundles a test app for size analysis and starts the webpack bundle analyzer
  analyze: env => {
    const config = CONFIGS.bundle(env);
    config.plugins.push(new BundleAnalyzerPlugin());
    return config;
  }
};

function getConfig(env) {
  if (env.test || env.testBrowser || env.test_browser) {
    return CONFIGS.test(env);
  }
  if (env.bench) {
    return CONFIGS.bench(env);
  }
  if (env.analyze) {
    return CONFIGS.analyze(env);
  }

  return CONFIGS.bundle(env);
}

module.exports = (env = {}) => {
  // env = getEnv(env);
  // NOTE uncomment to display env
  console.log('webpack env', JSON.stringify(env));

  const config = getConfig(env);
  // NOTE uncomment to display config
  console.log('webpack config', JSON.stringify(config, null, 2));

  return config;
};
