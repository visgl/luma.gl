require('@babel/register')({
  presets: [ '@babel/env' ]
})

module.exports = require('./src');
