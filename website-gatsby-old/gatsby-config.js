const {getGatsbyConfig, setSiteConfig, registerReactComponent} = require('./ocular/gatsby');

const config = require('./ocular-config');

setSiteConfig(config);

module.exports = getGatsbyConfig(config);

