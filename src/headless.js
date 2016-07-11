import {getGlobal} from './utils/is-browser';

let headlessGLTypes;
let headlessGL;
try {
  headlessGLTypes = require('gl/wrap');
  headlessGL = require('gl');
} catch (error) {
  /* ignore */
}

const glob = getGlobal();
glob.headlessGLTypes = headlessGLTypes;
glob.headlessGL = headlessGL;

// TODO - not necessary - Make sure webgl-types initializes with right types
require('./webgl/webgl-types');

// Now import standard luma.gl package
module.exports = require('./index');
