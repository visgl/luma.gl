const {getGatsbyConfig, setSiteConfig} = require('./ocular/gatsby');
const config = require('./ocular-config');

setSiteConfig(config);
module.exports = getGatsbyConfig(config);
