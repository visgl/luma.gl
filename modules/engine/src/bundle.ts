// @ts-nocheck
const moduleExports = require('./index');
const _global = typeof window === 'undefined' ? global : window;
_global.luma = _global.luma || {};
module.exports = Object.assign(_global.luma, moduleExports);
