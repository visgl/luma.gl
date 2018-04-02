// Launch script for various Node test configurations

// Enables ES2015 import/export in Node.js
require('reify');

require('../aliases');

/* global process */
const path = require('path');
const moduleAlias = require('module-alias');

const {BrowserTestDriver} = require('probe.gl/test-utils');

const mode = process.argv.length >= 3 ? process.argv[2] : 'default';
const arg = process.argv.length >= 4 ? process.argv[3] : 'default';
console.log(`Running ${mode} {arg} tests...`); // eslint-disable-line

switch (mode) {
case 'test':
  require('./src/index'); // Run the tests
  break;

case 'test-dist':
  // Load deck.gl itself from the dist folder
  const dist = arg === 'default' ? 'es6' : arg;
  moduleAlias.addAlias('luma.gl', path.resolve(`./dist/${dist}`));

  require('./index-webgl-independent-tests');
  require('./index-webgl-dependent-tests');
  require('./src/debug/seer-integration');
  break;

case 'test-ci':
  // Run a smaller selection of the tests (avoid overwhelming Travis CI)
  require('./index-webgl-independent-tests');
  require('./index-webgl-dependent-tests');
  require('./src/debug/seer-integration');
  break;

case 'test-browser':
  new BrowserTestDriver().run({
    process: 'webpack-dev-server',
    parameters: ['--config', 'test/webpack.config.js', '--env.testBrowser'],
    exposeFunction: 'testDone'
  });
  break;

case 'test-render':
case 'render':
  new BrowserTestDriver().run({
    process: 'webpack-dev-server',
    parameters: ['--env.render'],
    exposeFunction: 'testDone'
  });
  break;

case 'bench':
  require('./bench/index'); // Run the benchmarks
  break;

default:
  console.error(`Unknown test mode ${mode}`); // eslint-disable-line
}
