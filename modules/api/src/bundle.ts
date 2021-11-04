const moduleExports_ = require('./index');
globalThis.luma = globalThis.luma || {};
module.exports = Object.assign(globalThis.luma, moduleExports_);
