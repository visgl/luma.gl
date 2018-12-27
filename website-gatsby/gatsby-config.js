// Enables ES6 imports in any imported file (not in this file).
require('reify');

const {getGatsbyConfig, setSiteConfig} = require('./ocular/gatsby');
const config = require('./ocular-config');

setSiteConfig(config);
module.exports = getGatsbyConfig(config);
