// @ts-nocheck
const GLConstants = require('./index').default;
const _global = typeof window === 'undefined' ? global : window;
_global.luma = _global.luma || {};
module.exports = Object.assign(_global.luma, {GL: GLConstants});
