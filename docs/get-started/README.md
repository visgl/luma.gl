# Getting Started

To use luma.gl in an application, simply install it using `yarn`:

```
yarn add luma.gl
```

Note: While we'll use `yarn` for these instructions, as it's the tool we use for development, `npm` can be used as a drop-in substitute in most cases. A map of `npm` instructions to `yarn` is available [here](https://yarnpkg.com/lang/en/docs/migrating-from-npm/).

## Using with Node.js

luma.gl is built to run using [headless-gl](https://www.npmjs.com/package/gl) under Node.js, which can be extremely useful for unit testing. It is important to note that `headless-gl` only supports WebGL 1 and few extensions, so not all of luma.gl's features will be available.

Use `yarn install gl` to install `headless-gl`. luma.gl will automatically use it when running under Node.js. You can then create a context using the `createGLContext` context function.

```js
import 'luma.gl';
import {createGLContext, Model, ...} from '@luma.gl/core';
const gl = createGLContext({width, height, ...});
```

## Interoperation with Other WebGL Applications

luma.gl is build to interoperate cleanly with other WebGL applications using the same WebGL context. This is critical in geospatial applications, where `luma.gl` is often rendering over a base map drawn by another application.

The key to luma.gl's interoperability is careful state management. luma.gl will track GL context changes and restore them after operations are complete.


## Using luma.gl in Isorender Applications

luma.gl is designed to support isorender application, i.e. the library can be loaded without problems under Node.js, as long as the application doesn't actually try to use WebGL (i.e. create WebGL contexts). However when luma.gl discovers that headless gl is not available it tries to give a helpful message explaining the situation. This can safely be ignored.

Remember that you **can** actually create WebGL contexts under Node.js, as long as the headless `gl` is installed in your `node_modules` directory. More information on [using luma.gl with Node.js](/docs/get-started/README.md).


## FAQ

We occasionally mark github issues that contain answers to questions that pop up repeatedly with the [`FAQ` label](https://github.com/uber/luma.gl/issues?utf8=%E2%9C%93&q=label%3AFAQ+).
