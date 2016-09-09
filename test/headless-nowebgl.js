require('babel-core/register');
require('babel-polyfill');

// Quick test that webgl independent code works
require('./webgl/core-spec');
require('./webgl-independent');
