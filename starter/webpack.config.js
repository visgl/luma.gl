const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
  }

  // plugins: [
  //   new HtmlWebpackPlugin({title: 'Example 01'})
  // ]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;//env => env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
