// decorate tape-catch with tape-promise
import test_ from 'tape-catch';
import tapePromise from 'tape-promise';
export default tapePromise(test_);

// Avoid generating a lot of big context divs
import {setContextDefaults} from 'luma.gl';
setContextDefaults({width: 1, height: 1, debug: true, throwOnFailure: false, throwOnError: false});

import {createGLContext, makeDebugContext} from 'luma.gl';

export function createTestContext(opts = {}) {
  return makeDebugContext(createGLContext(opts));
}

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnFailure: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};

