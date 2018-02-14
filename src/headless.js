/* eslint-disable quotes, no-console */
/* global console */
import luma from './init';
import isBrowser from './utils/is-browser';
import assert from 'assert';

const ERR_NO_HEADLESS_GL = `\
Failed to dynamically load headless gl. \
gl not installed or not accessible from this directory.`;

if (!isBrowser) {
  try {
    luma.globals.headlessGL = module.require('gl');
    luma.globals.headlessTypes = module.require('gl/wrap');
  } catch (error) {
    console.error(ERR_NO_HEADLESS_GL);
    console.error(`Node error: ${error.message}`);
  }
  assert(luma.globals.headlessTypes.WebGLRenderingContext);
}

// Make sure luma.gl initializes with valid types
require('./webgl/api/types');

export const isWebglAvailable = isBrowser || luma.globals.headlessGL;
