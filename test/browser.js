require('babel-polyfill');
require('tap-browser-color')();

require('./webgl-independent');
require('./webgl');

require('./core');

// deprecated
require('../src/deprecated/test');
