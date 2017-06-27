// Enables ES2015 import/export in Node.js
require('reify');

// Mock addEventListener on window, required for seer
const {window} = require('../src/utils/globals');
window.addEventListener = () => {};

// Registers an alias for this module
const path = require('path');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('luma.gl', path.resolve('./src'));

// Import headless luma support
require('luma.gl/headless');

// Run the tests
require('./index-webgl-independent-tests');
require('./index-webgl-dependent-tests');
require('./debug/seer-integration');
