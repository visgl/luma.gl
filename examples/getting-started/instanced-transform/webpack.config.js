// eslint-disable-next-line import/no-extraneous-dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {resolve} = require('path');

const CONFIG = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  plugins: [new HtmlWebpackPlugin({title: 'Transformed Instanced Cube'})]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = (env) => (env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
