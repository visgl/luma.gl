// decorate tape-catch with tape-promise
import test_ from 'tape-catch';
import tapePromise from 'tape-promise';
export default tapePromise(test_);
export {default as deepCopy} from './deep-copy';

import {createGLContext} from '@luma.gl/webgl';
import {makeDebugContext} from '@luma.gl/debug';

export {getResourceCounts, getLeakedResources} from './resource-tracker.js';

const CONTEXT_DEFAULTS = {
  width: 1,
  height: 1,
  debug: true,
  throwOnFailure: false,
  throwOnError: false
};

export function createTestContext(opts = {}) {
  opts = Object.assign({}, opts, CONTEXT_DEFAULTS);
  return makeDebugContext(createGLContext(opts));
}

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnFailure: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
