const webpack = require('webpack');

const config = require('./config');

module.exports = Object.assign(config, {

  entry: [
    // 'webpack-hot-middleware/client',
    'webpack/hot/dev-server',
    './src/main'
  ],

  devtool: 'source-map',

  plugins: config.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ])

});
