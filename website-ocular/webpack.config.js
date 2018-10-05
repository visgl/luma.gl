const {resolve} = require('path');

const ALIASES = require('../aliases');

module.exports = {

  resolve: {
    modules: [
      resolve(__dirname, '../node_modules')
    ],

    alias: ALIASES
  }

};
