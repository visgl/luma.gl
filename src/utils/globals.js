/* global window, global */
import {isBrowser} from './is-browser';

// TODO - Move this definition out of utils
export const luma = {
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

  // Logger will also be attached here.
};

if (isBrowser) {
  // Export luma symbols as luma, luma and Luma on global context
  if (window.luma) {
    throw new Error('luma.gl - multiple versions detected');
  }
  window.luma = luma;
} else {
  if (global.luma) {
    throw new Error('luma.gl - multiple versions detected');
  }
  global.luma = luma;
}

module.exports = {
  global: isBrowser ? window : global,
  luma
};
