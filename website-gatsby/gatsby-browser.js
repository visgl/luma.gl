const {setSiteConfig, registerReactComponent} = require('./ocular/gatsby');
const config = require('./ocular-config');

const Hero = require('./src/hero').default ;

registerReactComponent('Hero', Hero);

// TODO/ib - Major hack to work around broken StaticQuery in persistent-layout.js.
// Makes config available in the browser.
exports.onClientEntry = () => {
  setSiteConfig(config);
  console.log("We've started!", config)
}
