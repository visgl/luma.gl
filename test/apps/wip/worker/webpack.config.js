const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const EXAMPLE_DIR = resolve(__dirname, '../../../../examples')

const CONFIG = {
  mode: 'development',

  devServer: {
    // Static assets
    contentBase: resolve(__dirname, 'core/picking/')
  },

  resolve: {
    alias: {
      examples: EXAMPLE_DIR
    }
  },

  entry: {
    app: resolve('./app.js')
  },

  plugins: [new HtmlWebpackPlugin({title: 'Shadowmap'})]
};

const WORKER_CONFIG = {
  target: 'webworker',

  entry: {
    worker: resolve('./worker.js')
  },

  plugins: []
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => {
  const config = env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;

  const workerConfig = Object.assign({}, config, WORKER_CONFIG);

  return [config, workerConfig];
};
