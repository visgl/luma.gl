# Using with Node.js

Even though WebGL is a browser API, when running in Node.js applications can safely import luma.gl without any ill effects. However in a default luma.gl configuration (installation) the application will not be able to create WebGL contexts under Node.js, meaning that most of the luma.gl API remains unavailable.

To get around this, luma.gl is integrated with the [headless-gl](https://www.npmjs.com/package/gl) module which provides a WebGL1 API implementation under Node.js (even emulating OpenGL in software if needed, allowing luma.gl to run on server machines that do not have GPUs).

The main limitation is that `headless-gl` only supports WebGL1 and almost no extensions, so you will need to carefully choose what features you use in your code. luma.gl's capability detection API and shader transpilation features can be helpful here.

To minimize the amount of configuration needed, luma.gl always attempts to load headless gl when running under Node.js. Use `npm install gl` to install `headless-gl`. If `gl` is installed and properly configured on your system (`gl` can often autodetect your configuration), you should be able to run luma.gl in Node.js from the console, even on machines that do not have GPUs.

```js
import 'luma.gl';
import {createGLContext, Model, ...} from 'luma.gl';
const gl = createGLContext({width, height, ...});
```

# Remarks

* While you can certainly use [headless-gl](https://www.npmjs.com/package/gl) directly to create a context (without passing it to `createGLContext`), the `createGLContext` method will automatically create a browser or headless context depending on the environment, enabling you to write cleaner application code that works both in both environments.
* If working in Node.js, also note that luma.gl has two separate implementations of its I/O functions, e.g. `loadImage`/`loadImages`, that work both in browser and under Node.js. (Browser apps tend to rely on the DOM `Image` class to load images, which is not available under Node.js).
