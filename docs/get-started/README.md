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

luma.gl's I/O functions (e.g. `loadImage`) are also written to work both in the browser and under Node.js.


## Interoperation with Other WebGL Applications

luma.gl is build to interoperate cleanly with other WebGL applications using the same WebGL context. This is critical in geospatial applications, where `luma.gl` is often rendering over a base map drawn by another application.

The key to luma.gl's interoperability is careful state management. luma.gl will track GL context changes and restore them after operations are complete.
