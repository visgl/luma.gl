// decorate tape-catch with tape-promise
import test_ from 'tape-catch';
import tapePromise from 'tape-promise';
export default tapePromise(test_);
export {default as deepCopy} from './deep-copy';

import gl from 'gl';

import {setContextDefaults, createGLContext} from '@luma.gl/core';
import {makeDebugContext} from '@luma.gl/debug';

setContextDefaults({
  // Register headless gl
  createNodeContext: gl,
  // Avoid generating a lot of big context divs
  width: 1,
  height: 1,
  debug: true,
  throwOnError: false
});

export function createTestContext(opts = {}) {
  return makeDebugContext(createGLContext(opts));
}

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
