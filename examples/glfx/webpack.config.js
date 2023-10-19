// const webpack = require('webpack');
const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2

const libraryName = 'fx';
const fileName = 'glfx-es6';

const plugins = [];
let outputFile;
let mode = 'development';

if (env === 'minified') {
  mode = 'production';
  outputFile = `${fileName}.min.js`;
} else {
  outputFile = `${fileName}.js`;
}

module.exports = {
  mode,
  entry: path.resolve(__dirname, './app.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: outputFile,
    publicPath: '/dist/',
    library: libraryName,
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    mainFields: ['esnext', 'browser', 'module', 'main'],
    extensions: ['.json', '.js'],
    alias: require('../../aliases')
  },
  plugins
};
