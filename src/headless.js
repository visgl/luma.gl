import {luma, isBrowser} from './utils';

if (!isBrowser) {
  luma.globals.headlessGL = require('gl');
  luma.globals.headlessTypes = require('gl/wrap');
  if (!luma.globals.headlessTypes.WebGLRenderingContext) {
    throw new Error('Could not access headless WebGL type definitions');
  }
}

// Make sure luma.gl initializes with valid types
require('./webgl/webgl-types');

// Now import standard luma.gl package
module.exports = require('./index');
