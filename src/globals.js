/* global window, global */
import isBrowser from './utils/is-browser';
import {version} from '../package.json';

const _global = isBrowser ? window : global;

// TODO - Move this definition out of utils
const luma = {
  VERSION: version,

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
  },

  global: _global

  // Logger will also be attached here.
};

// Export luma symbols as luma, luma and Luma on global context
if (_global.luma && _global.luma.VERSION !== luma.VERSION) {
  const versions = `${_global.luma.VERSION} vs ${luma.VERSION}`;
  throw new Error(`luma.gl - multiple versions detected: ${versions}`);
}
_global.luma = luma;

module.exports = luma;
