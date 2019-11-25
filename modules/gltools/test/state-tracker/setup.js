// TEST SETUP

import {createGLContext} from '@luma.gl/core';
import {makeDebugContext} from '@luma.gl/debug';

const CONTEXT_DEFAULTS = {
  width: 1,
  height: 1,
  debug: true,
  throwOnFailure: false,
  throwOnError: false
};

export function createTestContext(opts = {}) {
  opts = Object.assign(opts, CONTEXT_DEFAULTS);
  return makeDebugContext(createGLContext(opts));
}

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnFailure: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
