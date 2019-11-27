import {Log} from 'probe.gl';

export {assert, deepArrayEqual, isObjectEmpty} from './utils';
export {isBrowser, isNode, isElectron, isBrowserMainThread} from './environment';
export {global, window, self} from './globals';
export {cssToDevicePixels, cssToDeviceRatio, getDevicePixelRatio} from './device-pixels';
export {isWebGL, isWebGL2} from './webgl-checks';

export const log = new Log({id: 'gltools'}).enable();
