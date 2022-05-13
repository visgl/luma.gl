const moduleExports = require('./index');

// @ts-ignore
globalThis.luma = globalThis.luma || {};
// @ts-ignore
module.exports = Object.assign(globalThis.luma, moduleExports);
