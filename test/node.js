require('../aliases');

// Mock addEventListener on window, required for seer
const {window} = require('../src/utils/globals');
window.addEventListener = () => {};

// Run the tests
require('./index-webgl-independent-tests');
require('./index-webgl-dependent-tests');
require('./src/debug/seer-integration');
