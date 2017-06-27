const CopyWebpackPlugin = require('copy-webpack-plugin');
const {join} = require('path');

const rootDir = join(__dirname, '../..');
const libSources = join(rootDir, 'src');
// const demoDir = join(__dirname, '..');

module.exports = {

  entry: ['./src/main'],

  module: {
    rules: [{
      test: /\.js$/,
      exclude: [/node_modules/],
      loader: 'babel-loader'
    }, {
      test: /\.scss$/,
      exclude: [/node_modules/],
      loaders: ['style-loader', 'css-loader', 'sass-loader', 'autoprefixer-loader']
    }, {
      test: /\.(eot|svg|ttf|woff|woff2|gif|jpe?g|png)$/,
      exclude: [/node_modules/],
      loader: 'url-loader'
    }]
  },

  resolve: {
    // modules: [
    //   resolve(rootDir, 'node_modules'),
    //   resolve(demoDir, 'node_modules')
    // ],
    alias: {
      'luma.gl': libSources,
      webworkify: 'webworkify-webpack-dropin'
    }
  },

  node: {
    fs: 'empty'
  },

  plugins: [
    new CopyWebpackPlugin([
      // This will copy the contents to the distribution bundle folder
      {
        from: '../docs',
        to: 'docs'
      },
      {
        from: './src/static'
      }
    ])
  ]
};
