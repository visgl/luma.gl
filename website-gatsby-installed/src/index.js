
module.exports.getGatsbyNodeCallbacks = require('./gatsby-node/get-gatsby-node-callbacks');

module.exports.getGatsbyConfig = require('./gatsby-config/get-gatsby-config');

// gatsby-config
const {setSiteConfig, getSiteConfig} = require('./gatsby-config/site-config');

module.exports.setSiteConfig = setSiteConfig;
module.exports.getSiteConfig = getSiteConfig;

const {registerReactComponent, getReactComponent} = require('./gatsby-config/component-registry');

module.exports.registerReactComponent = registerReactComponent;
module.exports.getReactComponent = getReactComponent;

// UTILS
const {log, COLOR} = require('./utils/log');

module.exports.log = log;
module.exports.log = COLOR;
