require('babel-core/register');
require('babel-polyfill');

// Quick test that webgl independent code works
require('./webgl/context-no-headless.spec');
require('./webgl-independent');
