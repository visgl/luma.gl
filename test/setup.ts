// decorate tape-catch with tape-promise
import {webglDevice} from '@luma.gl/test-utils';

export {default as deepCopy} from './utils/deep-copy';

export {getResourceCounts, getLeakedResources} from './utils/resource-tracker';

export const fixture: {gl:WebGL2RenderingContext} = {
  gl: webglDevice.gl,
};
