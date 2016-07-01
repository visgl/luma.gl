require('babel-core/register');
require('babel-polyfill');

require('./gpu-independent-tests');
require('./gpu-dependent-tests');
require('./node-dependent-tests');
