// Enables ES2015 import/export in Node.js
require('reify');

// Mock addEventListener on window, required for seer
const {window} = require('../src/utils/globals');
window.addEventListener = () => {};

// Registers an alias for this module
const path = require('path');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('luma.gl/test', path.resolve(__dirname));
moduleAlias.addAlias('luma.gl', path.resolve(__dirname, '../src'));

// Run the tests
require('./index-webgl-independent-tests');
require('./index-webgl-dependent-tests');
require('./src/debug/seer-integration');
