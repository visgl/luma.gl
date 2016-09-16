// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */
export const isNode =
  typeof process === 'object' &&
  String(process) === '[object process]' &&
  !process.browser;
export const isBrowser = !isNode;

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
  isBrowser,
  global: isBrowser ? window : global,
  luma
};
