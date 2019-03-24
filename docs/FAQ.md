# Frequently Asked Questions


## Github Issues

We occasionally mark github issues that contain answers to questions that pop up repeatedly with the [`FAQ` label](https://github.com/uber/luma.gl/issues?utf8=%E2%9C%93&q=label%3AFAQ+).


## Using luma.gl in isorender applications

> Q: I am using luma.gl in an isorender application and I get an error message from luma.gl on the server

For typical isorender scenarios, you just need to the application not to fail while intializing the luma.gl library, you don't actually instantiate e.g. WebGL contexts on the server.

luma.gl is designed to support isorender application, i.e. the library can be loaded without problems under Node.js, as long as the application doesn't actually try to use WebGL (i.e. create WebGL contexts).

However when luma.gl discovers that headless gl is not available it tries to give a helpful message explaining the situation. This can safely be ignored.

Remember that you **can** actually create WebGL contexts under Node.js, as long as the headless `gl` is installed in your `node_modules` directory. More information on [using luma.gl with Node.js](/docs/get-started/using-with-node.md).
