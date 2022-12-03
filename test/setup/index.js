// decorate tape-catch with tape-promise
import test_ from 'tape-promise/tape';
import tapePromise from 'tape-promise';

import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

export default tapePromise(test_);
export {default as deepCopy} from './deep-copy';

export {getResourceCounts, getLeakedResources} from './resource-tracker.js';

/** @type {{gl: WebGLRenderingContext, gl2: WebGL2RenderingContext}} */
export const fixture = {
  gl: webgl1Device.gl,
  gl2: webgl2Device?.gl2
};
