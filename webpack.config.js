const {resolve} = require('path');
// const webpack = require('webpack');

const COMMON_CONFIG = {
  stats: {
    warnings: false
  },

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

  plugins: [],

  node: {
    fs: 'empty'
  }
};

const LIBRARY_BUNDLE_CONFIG = Object.assign({}, COMMON_CONFIG, {
  // Bundle the transpiled code in dist
  entry: {
    lib: resolve('./src/index.js')
  },

  // Generate a bundle in dist folder
  output: {
    path: resolve('./dist'),
    filename: '[name]-bundle.js',
    library: 'luma.gl',
    libraryTarget: 'umd'
  },

  // Exclude any non-relative imports from resulting bundle
  externals: [
    /^[a-z\.\-0-9]+$/
  ],

  plugins: [
    // new webpack.optimize.UglifyJsPlugin({comments: false})
  ]
});

const TEST_CONFIG = Object.assign({}, COMMON_CONFIG, {
  devServer: {
    stats: {
      warnings: false
    },
    quiet: true
  },

  // Bundle the tests for running in the browser
  entry: {
    'test-browser': resolve('./test/browser.js')
  },

  // Generate a bundle in dist folder
  output: {
    path: resolve('./dist'),
    filename: '[name]-bundle.js'
  },

  devtool: '#source-maps',

  resolve: {
    alias: {
      'luma.gl/test': resolve('./test'),
      'luma.gl': resolve('./src')
    }
  }
});

const BENCH_CONFIG = Object.assign({}, TEST_CONFIG, {
  entry: {
    'test-browser': resolve('./test/bench/browser.js')
  }
});

// Replace the entry point for webpack-dev-server

BENCH_CONFIG.module.noParse = [
  /benchmark/
];

module.exports = env => {
  env = env || {};
  if (env.bench) {
    return BENCH_CONFIG;
  }
  if (env.test) {
    return TEST_CONFIG;
  }
  return LIBRARY_BUNDLE_CONFIG;
}
