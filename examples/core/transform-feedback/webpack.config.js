const {resolve} = require('path');

const CONFIG = {
  entry: {
    app: resolve('./app.js')
  },
  devtool: 'source-maps'
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
