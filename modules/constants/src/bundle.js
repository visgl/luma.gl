const GLConstants = require('./index').default;

// @ts-ignore
globalThis.luma = globalThis.luma || {};

// @ts-ignore
module.exports = Object.assign(globalThis.luma, {GL: GLConstants});
