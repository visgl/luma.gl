// luma.gl, MIT license
module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  all: 'true',
  sourceMap: false,
  instrument: true,
  extensions: ['.js', '.ts'],
  include: ['dev-modules', 'modules/**/src'],
  exclude: [
    '**/deprecated',
    '**/bundle.ts',
    // no need to test coverage of constants
    'modules/constants',
    // core is just re-exporting things at the moment
    'modules/core',
    // debug is an optional dependency
    'modules/debug',
    // we don't have a test setup for WebGPU yet
    'modules/webgpu',
    // these are test utilities
    'modules/test-utils'
  ]
};
