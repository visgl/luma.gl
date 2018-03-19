const {resolve} = require('path');

// babel-polyfill/babel-loader used for IE 11 testing.
const CONFIG = {
  entry: {
    app: ['babel-polyfill', resolve('./app.js')]
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  devtool: 'source-map'
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
