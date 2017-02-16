import './init';
import isBrowser from './utils/is-browser';
import {global} from './utils/globals';

if (!isBrowser) {
  global.luma.globals.headlessGL = require('gl');
  global.luma.globals.headlessTypes = require('gl/wrap');
  if (!global.luma.globals.headlessTypes.WebGLRenderingContext) {
    throw new Error('Could not access headless WebGL type definitions');
  }
}

// Make sure luma.gl initializes with valid types
require('./webgl/webgl-types');

// Now import standard luma.gl package
// module.exports = require('./index');
