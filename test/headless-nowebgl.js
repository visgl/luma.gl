// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *without* headless-gl included

require('babel-core/register');
require('babel-polyfill');

// Quick test that webgl independent code works
require('./webgl/context-no-headless.spec');
require('./index-webgl-independent-tests');
