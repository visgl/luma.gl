const GLConstants = require('./index').default;

const _global = typeof window === 'undefined' ? global : window;
// @ts-ignore
_global.luma = _global.luma || {};

// @ts-ignore
module.exports = Object.assign(_global.luma, {GL: GLConstants});
