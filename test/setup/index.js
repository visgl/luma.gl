// decorate tape-catch with tape-promise
import test_ from 'tape-promise/tape';
import tapePromise from 'tape-promise';
export default tapePromise(test_);
export {default as deepCopy} from './deep-copy';

import {createTestContext} from '@luma.gl/test-utils';

export {getResourceCounts, getLeakedResources} from './resource-tracker.js';

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
