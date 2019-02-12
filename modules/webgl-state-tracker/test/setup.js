// TEST SETUP

import {setContextDefaults, createGLContext} from 'luma.gl';
import {makeDebugContext} from '@luma.gl/debug';

// Avoid generating a lot of big context divs
setContextDefaults({width: 1, height: 1, debug: true, throwOnFailure: false, throwOnError: false});

export function createTestContext(opts = {}) {
  return makeDebugContext(createGLContext(opts));
}

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnFailure: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
