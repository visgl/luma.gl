import luma from './init';
import isBrowser from './utils/is-browser';

if (!isBrowser) {
  luma.globals.headlessGL = require('gl');
  luma.globals.headlessTypes = require('gl/wrap');
  if (!luma.globals.headlessTypes.WebGLRenderingContext) {
    throw new Error('Could not access headless WebGL type definitions');
  }
}

// Make sure luma.gl initializes with valid types
require('./webgl/api/types');

// Now import standard luma.gl package
// module.exports = require('./index');
