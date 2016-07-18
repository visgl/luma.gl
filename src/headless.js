import {global, lumaGlobals} from './utils';

// We want to run on both brow
//try {
lumaGlobals.headlessGL = require('gl');
lumaGlobals.headlessTypes = require('gl/wrap');
// } catch (error) {
//   /* ignore */
// }

if (!lumaGlobals.headlessTypes.WebGLRenderingContext) {
  throw new Error('Could not access headless WebGL type definitions');
}

// Just to trigger check and make sure luma.gl initializes with valid types
require('./webgl/webgl-types');

// Now import standard luma.gl package
module.exports = require('./index');
