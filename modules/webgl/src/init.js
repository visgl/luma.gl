import {log} from '@luma.gl/gltools';
import {Stats} from '@probe.gl/stats';
import {isBrowser} from '@probe.gl/env';

// Version detection using babel plugin
/* global __VERSION__ */
// @ts-ignore
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'untranspiled source';

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';
// Assign luma.log.level in console to control logging: \
// 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
// luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

export class StatsManager {
  constructor() {
    this.stats = new Map();
  }

  get(name) {
    if (!this.stats.has(name)) {
      this.stats.set(name, new Stats({id: name}));
    }

    return this.stats.get(name);
  }
}

const lumaStats = new StatsManager();

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
