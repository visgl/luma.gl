require('babel-polyfill');

require('./webgl-independent');
require('./webgl');

// experimental
require('../src/experimental/test');

// deprecated
require('../src/deprecated/test');
