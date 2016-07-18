// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */
function isBrowser() {
  const isNode =
    typeof process === 'object' &&
    String(process) === '[object process]' &&
    !process.browser;
  return !isNode;
};

const glob = isBrowser() ? window : global;

// Export lumagl symbols as luma, lumagl and LumaGL on global context
if (glob.lumagl) {
  throw new Error('lumagl multiple copies detected');
}
glob.lumagl = {};
glob.luma = glob.lumagl;
glob.LumaGL = glob.lumagl;

// Keep luma globals in a globals sub-object
glob.lumagl.globals = {
  headlessGL: null,
  headlessTypes: null,
  modules: {},
  nodeIO: {}
};

module.exports = {
  isBrowser,
  global: glob,
  lumagl: glob.lumagl,
  lumaGlobals: glob.lumagl.globals
};
