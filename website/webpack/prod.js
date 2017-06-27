const config = require('./config');

const {resolve} = require('path');

module.exports = Object.assign(config, {

  output: {
    path: resolve('./dist'),
    filename: 'bundle.js'
  }

});
