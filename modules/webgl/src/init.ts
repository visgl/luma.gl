import {log} from '@luma.gl/gltools';
import {isBrowser} from '@probe.gl/env';
import {luma, lumaStats} from '@luma.gl/api';
import WebGLDevice from './device/webgl-device';

// Version detection using babel plugin
// @ts-expect-error
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'untranspiled source';

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';
// Assign luma.log.level in console to control logging: \
// 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
// luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

if (globalThis.luma && globalThis.luma.VERSION !== VERSION) {
  throw new Error(`luma.gl - multiple VERSIONs detected: ${globalThis.luma.VERSION} vs ${VERSION}`);
}

if (!globalThis.luma) {
  luma.registerDevices([WebGLDevice]);

  if (isBrowser()) {
    log.log(1, `luma.gl ${VERSION} - ${STARTUP_MESSAGE}`)();
  }

  globalThis.luma = globalThis.luma || {
    VERSION,
    version: VERSION,
    log,

    // A global stats object that various components can add information to
    // E.g. see webgl/resource.js
    stats: lumaStats,

    // Keep some luma globals in a sub-object
    // This allows us to dynamically detect if certain modules have been
    // included (such as IO and headless) and enable related functionality,
    // without unconditionally requiring and thus bundling big dependencies
    // into the app.
    globals: {
      modules: {},
      nodeIO: {}
    }
  };
}

export {lumaStats};
export default globalThis.luma;
