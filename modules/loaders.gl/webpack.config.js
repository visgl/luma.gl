const {resolve} = require('path');

const CONFIG = {
  target: 'node',

  mode: 'development',

  entry: {
    glbdump: resolve('./scripts/glbdump')
  },

  output: {
    path: resolve('./dist/scripts')
  }

  // module: {
  //   rules: [
  //     {
  //       // Compile ES2015 using babel
  //       test: /\.js$/,
  //       loader: 'babel-loader',
  //       exclude: [/node_modules/]
  //     }
  //   ]
  // }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
