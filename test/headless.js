require('source-map-support').install();
require('babel-core/register');
require('babel-polyfill');

// require('./webgl-independent');
require('./webgl');
// require('./node-dependent');

require('./core');

// experimental
require('../src/experimental/test');

// deprecated
require('../src/deprecated/test');
