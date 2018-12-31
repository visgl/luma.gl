const {getGatsbyConfig, setSiteConfig, registerReactComponent} =
  // require('../website-gatsby/ocular/gatsby');
  require('./src');

const config = require('./ocular-config');

setSiteConfig(config);

module.exports = getGatsbyConfig(config);

