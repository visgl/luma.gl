require('babel-polyfill');
require('tap-browser-color')();

require('./gpu-dependent-tests');
require('./gpu-independent-tests');
