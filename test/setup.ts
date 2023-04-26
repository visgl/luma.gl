// decorate tape-catch with tape-promise
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

export {default as deepCopy} from './utils/deep-copy';

export {getResourceCounts, getLeakedResources} from './utils/resource-tracker';

/** @type {{gl: WebGLRenderingContext, gl2: WebGL2RenderingContext}} */
export const fixture = {
  gl: webgl1Device.gl,
  gl2: webgl2Device?.gl2
};
