// luma.gl, MIT license
module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  all: 'true',
  sourceMap: false,
  instrument: true,
  extensions: ['.ts'],
  include: ['dev-modules', 'modules/**/src'],
  exclude: [
    '**/deprecated',
    '**/bundle.ts',
    'modules/constants',
    'modules/core',
    'modules/debug',
    'modules/test-utils/'
  ]
};
