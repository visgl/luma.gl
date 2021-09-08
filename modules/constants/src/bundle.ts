// @ts-nocheck
const GLConstants = require('./index').default;
globalThis.luma = globalThis.luma || {};
module.exports = Object.assign(globalThis.luma, {GL: GLConstants});
