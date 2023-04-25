import {isBrowser} from '@probe.gl/env';
import {log} from './lib/utils/log';
import {lumaStats} from './lib/utils/stats-manager';

// Version detection using babel plugin
// @ts-expect-error
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'untranspiled source';

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';
// Assign luma.log.level in console to control logging: \
// 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
// luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

declare global {
  var luma: any
};

if (globalThis.luma && globalThis.luma.VERSION !== VERSION) {
  throw new Error(`luma.gl - multiple VERSIONs detected: ${globalThis.luma.VERSION} vs ${VERSION}`);
}

if (!globalThis.luma) {
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
  };
}

export {lumaStats};
export default globalThis.luma;
