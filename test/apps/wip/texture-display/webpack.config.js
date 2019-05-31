const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  plugins: [new HtmlWebpackPlugin({title: 'Texture Display'})]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../../../../examples/webpack.config.local')(CONFIG)(env) : CONFIG);
