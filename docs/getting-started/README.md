# Getting Started

This tutorial will walk you through setting up a basic development environment for luma.gl applications using [webpack](https://webpack.js.org). Later tutorials will build on this one, so we recommend going through it first.

**Note:** It is assumed for these tutorials that you have some knowledge of the WebGL API. If you are unfamiliar with how to draw with WebGL, we highly recommend the excellent [WebGL 2 Fundamentals](https://webgl2fundamentals.org/).

From the command line, first run
```bash
mkdir luma-demo
cd luma-demo
npm init -y
```
to set up our project directory and initialize npm.


Next run
```bash
npm i @luma.gl/engine @luma.gl/webgl
npm i -D webpack webpack-cli webpack-dev-server html-webpack-plugin
```
to install our dependencies.

Open the file `package.json` (created when we initialized npm), and add the following to the `scripts` block:
```json
"start": "webpack-dev-server --open"
```

The full contents of the `package.json` should be the following (dependency version numbers might differ):

```json
{
  "name": "luma-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "webpack-dev-server --open"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@luma.gl/core": "^8.0.0"
  },
  "devDependencies": {
    "html-webpack-plugin": "^3.2.0",
    "webpack": "^4.41.2",
    "webpack-cli": "^3.3.9",
    "webpack-dev-server": "^3.9.0"
  }
}
```

Create a file `webpack.config.js` in the project root and add the following to it:
```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './index.js',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'luma.gl Demo',
    }),
  ],
  output: {
    filename: 'bundle.js'
  },
};
```
(For more information on Webpack, visit their [excellent documentation](https://webpack.js.org/guides/getting-started/)).

Now create a file `index.js` in the project root and add the following to it:
```js
import {AnimationLoop} from '@luma.gl/engine';

const loop = new AnimationLoop({
  onInitialize({gl}) {
    // Setup logic goes here
  },

  onRender({gl}) {
    // Drawing logic goes here
  }
});

loop.start();

```

This will be the basic structure of most luma.gl applications. To make sure everything works, let's add a draw command:
```js
import {AnimationLoop} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const loop = new AnimationLoop({
  onInitialize({gl}) {
    // Setup logic goes here
  },

  onRender({gl}) {
    // Drawing logic goes here
    clear(gl, {color: [0, 0, 0, 1]});
  }
});

loop.start();
```
and run
```bash
npm start
```
from the command line. If all went well, a tab should open in your default browser, and you should see a black rectangle at the top left of your screen.
