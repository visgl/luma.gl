// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file
const {resolve} = require('path');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const BabiliWebpackPlugin = require('babili-webpack-plugin');
// ...
module.exports = {
  entry: {
    app: resolve('./app.js')
  },
  output: {
    filename: 'bundle.js'
  },
  devtool: false,
  module: {
    // rules: [
    //   {
    //     test: /\.js$/,
    //     use: 'babel-loader?presets[]=es2015',
    //     exclude: /node_modules/
    //   }
    // ]
  },
  plugins: [
    new BabiliWebpackPlugin({
      babili: {
        presets: [
          [
            require('babel-preset-babili'), {
              mangle: {topLevel: true},
              deadcode: false
              // removeConsole: process.env.NODE_ENV === 'production',
            }
          ]
        ],
        plugins: [
          // 'transform-inline-environment-variables',
        ]
      }
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //    test: /\.js/,
    //    exclude: /node_modules/,
    //    compress: {
    //         warnings: true,
    //         screw_ie8: true,
    //         conditionals: true,
    //         unused: true,
    //         comparisons: true,
    //         sequences: true,
    //         dead_code: true,
    //         evaluate: true,
    //         join_vars: true,
    //         if_return: true
    //     },
    //     output: {
    //         comments: false
    //     }
    // }),
    new BundleAnalyzerPlugin()
  ]
};

// DELETE THIS LINE WHEN COPYING THIS EXAMPLE FOLDER OUTSIDE OF DECK.GL
// It enables bundling against src in this repo rather than installed deck.gl module
module.exports = require('../../webpack.config.local')(module.exports);
