// decorate tape-catch with tape-promise
import test_ from 'tape-catch';
import tapePromise from 'tape-promise';
export default tapePromise(test_);

// Avoid generating a lot of big context divs
import {setContextDefaults} from '../../src/webgl/context';
setContextDefaults({width: 1, height: 1, debug: true, throwOnFailure: false, throwOnError: false});

import {createGLContext, makeDebugContext} from 'luma.gl';

export const fixture = {
  gl: makeDebugContext(createGLContext()),
  gl2: makeDebugContext(createGLContext({webgl2: true, webgl1: false}))
};
