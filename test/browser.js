require('babel-polyfill');
require('tap-browser-color')();

require('./gpu-independent-tests');
require('./gpu-dependent-tests');
