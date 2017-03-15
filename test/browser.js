require('babel-polyfill');
require('tap-browser-color')();

require('./webgl-independent');
require('./webgl');

require('./core');

// experimental
require('../src/experimental/test');

// deprecated
require('../src/deprecated/test');
