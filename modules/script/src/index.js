// We use `module.exports` instead of `export default` in this file so that using
// require() to access the bundle will return one object instead of {default: ...}.
// `export` must be paired with `import` and `module.exports` must be paired with `require`
// https://github.com/webpack/webpack/issues/4039

/* global window, global */
const lumaGL = require('luma.gl');
require('luma.gl/debug');

const filters = require('../../glfx/src');

const _global = typeof window === 'undefined' ? global : window;

_global.luma = Object.assign({}, _global.luma, lumaGL, {filters});

module.exports = _global.luma;
