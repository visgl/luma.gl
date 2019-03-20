// We use `module.exports` instead of `export default` in this file so that using
// require() to access the bundle will return one object instead of {default: ...}.
// `export` must be paired with `import` and `module.exports` must be paired with `require`
// https://github.com/webpack/webpack/issues/4039

/* global window, global */
const _global = typeof window === 'undefined' ? global : window;

const lumaGL = require('@luma.gl/core');
require('@luma.gl/debug');

const filters = require('@luma.gl/glfx');

const shadertools = require('@luma.gl/shadertools');

const mathGL = require('math.gl');

_global.luma = Object.assign({}, _global.luma, lumaGL, {filters}, shadertools);

_global.mathgl = mathGL;

module.exports = _global.luma;
