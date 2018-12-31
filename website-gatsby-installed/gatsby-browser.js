// const {setSiteConfig, registerReactComponent} = require('../website-gatsby/ocular/gatsby');
const {setSiteConfig, registerReactComponent} = require('./src');
const config = require('./ocular-config');

const Hero = require('./src-local/hero').default ;
const DemoRunner = require('./src-local/demo-runner').default;
const DEMOS = require('./src-local/demos').default;

registerReactComponent('Hero', Hero);
registerReactComponent('DemoRunner', DemoRunner);
registerReactComponent('DEMOS', DEMOS);

// TODO/ib - Major hack to work around broken StaticQuery in persistent-layout.js.
// Makes config available in the browser.
exports.onClientEntry = () => {
  setSiteConfig(config);
  console.log("We've started!", config)
}
