// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file
const {resolve} = require('path');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const BabiliWebpackPlugin = require('babili-webpack-plugin');

module.exports = {
  entry: {
    app: resolve('./app.js')
  },
  output: {
    filename: 'dist/bundle-webpack.js'
  },
  devtool: false,
  module: {
    rules: [
      // {
      //   test: /\.js$/,
      //   use: 'babel-loader',
      //   include: [resolve('.'), resolve('../../../src')],
      //   exclude: /node_modules/
      // }
    ]
  },
  plugins: [
    // new BabiliWebpackPlugin({}, {verbose: true, warn: true, warnings: true}),
    /* eslint-disable camelcase */
    // new webpack.LoaderOptionsPlugin({
    //   minimize: true,
    //   debug: false
    // }),
    new webpack.optimize.UglifyJsPlugin({
      test: /\.js/,
      exclude: /node_modules/,
      compress: {
        warnings: true,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        join_vars: true,
        if_return: true
      },
      output: {
        comments: false
      }
    }),
    new BundleAnalyzerPlugin()
  ]
};

// DELETE THIS LINE WHEN COPYING THIS EXAMPLE FOLDER OUTSIDE OF DECK.GL
// It enables bundling against src in this repo rather than installed deck.gl module
module.exports = require('../../webpack.config.local')(module.exports, {
  // Import the deck.gl library from the dist-es6 directory in this repo to test shaking
  libAlias: resolve(__dirname, '../../../dist-es6')
});
