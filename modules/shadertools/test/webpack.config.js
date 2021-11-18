// This is a Webpack 2 configuration file
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devServer: {
    stats: {
      warnings: false
    },
    quiet: true
  },

  // Bundle the tests for running in the browser
  entry: {
    'test-fp64': resolve('./index-fp64.js')
  },

  // Generate a bundle in dist folder
  output: {
    path: resolve('./dist'),
    filename: '[name]-bundle.js'
  },

  devtool: '#inline-source-maps',

  resolve: {
    // @ts-expect-error
    alias: require('../../../../../aliases')
  },

  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  plugins: [new HtmlWebpackPlugin({title: 'Shader Module Tests'})]
};
