const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  devServer: {
    // Static assets
    contentBase: resolve(__dirname, '../../core/picking/')
  },

  entry: {
    app: resolve('./app.js')
  },

  plugins: [new HtmlWebpackPlugin({title: 'Shadowmap'})]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
