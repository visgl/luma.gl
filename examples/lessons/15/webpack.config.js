const {resolve} = require('path');

// This line enables bundling against src in this repo rather than installed module
const CONFIG = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  devtool: 'source-map'
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
