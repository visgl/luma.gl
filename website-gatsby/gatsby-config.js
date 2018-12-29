const {getGatsbyConfig, setSiteConfig, registerReactComponent} = require('./ocular/gatsby');

const config = require('./ocular-config');

setSiteConfig(config);

const Hero = require('./src/hero').default;

registerReactComponent('Hero', Hero);

module.exports = getGatsbyConfig(config);

