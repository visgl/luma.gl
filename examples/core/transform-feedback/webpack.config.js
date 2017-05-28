const {resolve} = require('path');

module.exports = {
  entry: {
    app: resolve('./app.js')
  },
  devtool: 'source-maps'
};

// DELETE THIS LINE WHEN COPYING THIS EXAMPLE FOLDER OUTSIDE OF DECK.GL
// It enables bundling against src in this repo rather than installed deck.gl module
module.exports = require('../../webpack.config.local')(module.exports);
