import {isBrowser} from './utils/is-browser';
import {global} from './utils/globals';
import log from './utils/log';
// Version detection
// TODO - this imports a rather large JSON file, we only need one field
import {version} from '../package.json';

const STARTUP_MESSAGE = `\
Assign luma.log.priority in console to control logging: \
0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

if (global.luma && global.luma.VERSION !== version) {
  throw new Error(`luma.gl - multiple versions detected: ${global.luma.VERSION} vs ${version}`);
}

if (!global.luma) {
  /* global console */
  /* eslint-disable no-console */
  if (isBrowser) {
    console.log(`luma.gl ${version} - ${STARTUP_MESSAGE}`);
  }

  global.luma = global.luma || {
    VERSION: version,
    version,
    log,

    // Keep some luma globals in a sub-object
    // This allows us to dynamically detect if certain modules have been
    // included (such as IO and headless) and enable related functionality,
    // without unconditionally requiring and thus bundling big dependencies
    // into the app.
    globals: {
      headlessGL: null,
      headlessTypes: null,
      modules: {},
      nodeIO: {}
    }
  };
}

export {global};
export default global.luma;
