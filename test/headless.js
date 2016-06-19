require('babel-core/register');
require('babel-polyfill');

require('./gpu-dependent-tests');
require('./node-dependent-tests');
require('./gpu-independent-tests');
