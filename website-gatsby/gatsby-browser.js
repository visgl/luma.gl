const {registerReactComponent} = require('gatsby-plugin-ocular/api');
const config = require('./ocular-config');

const Hero = require('./src/components/hero').default ;
const DemoRunner = require('./src/components/demo-runner').default;
const DEMOS = require('./src/components/demos').default;

registerReactComponent('Hero', Hero);
registerReactComponent('DemoRunner', DemoRunner);
registerReactComponent('DEMOS', DEMOS);

module.exports.onClientEntry = () => {
  console.log("Ocular started!", config)
}

module.exports.wrapPageElement = require(`./src/wrap-page`);
