const {resolve, join} = require('path');

const rootDir = join(__dirname, '../..');
const demoDir = join(__dirname, '..');
const libSources = join(rootDir, 'src');

module.exports = {

  entry: ['./src/main'],

  module: {
    rules: [{
      test: /\.js$/,
      exclude: [/node_modules/],
      loader: 'babel-loader'
    }, {
      test: /\.scss$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader', 'autoprefixer-loader']
    }, {
      test: /\.(eot|svg|ttf|woff|woff2|gif|jpe?g|png)$/,
      loader: 'url-loader'
    }]
  },

  resolve: {
    modules: [resolve(rootDir, 'node_modules'), resolve(demoDir, 'node_modules')],
    alias: {
      'luma.gl': libSources,
      webworkify: 'webworkify-webpack-dropin'
    }
  },

  node: {
    fs: 'empty'
  },

  plugins: [
  ]

};
