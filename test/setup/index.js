// decorate tape-catch with tape-promise
import test_ from 'tape-promise/tape';
import tapePromise from 'tape-promise';
export default tapePromise(test_);
export {default as deepCopy} from './deep-copy';

import {webgl1TestDevice, webgl2TestDevice} from '@luma.gl/test-utils';

export {getResourceCounts, getLeakedResources} from './resource-tracker.js';

/** @type {{gl: WebGLRenderingContext, gl2: WebGL2RenderingContext}} */
export const fixture = {
  gl: webgl1TestDevice.gl,
  gl2: webgl2TestDevice?.gl2
};
