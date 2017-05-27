# Using with Node.js

If [headless-gl](https://www.npmjs.com/package/gl) is installed and properly configured on your system (it can often autodetect your configuration), you should be able to run luma.gl in Node.js from the console, even machines that do not have GPUs.

To do this, your application should import 'luma.gl/headless':
```js
import 'luma.gl/headless';
import {createGLContext, Model, ...} from 'luma.gl';
const gl = createGLContext({width, height, ...});
```

The main limitation is that `headless-gl` only supports WebGL1.


* While you can certainly use [headless-gl](https://www.npmjs.com/package/gl) directly to create a context (without passing it to `createGLContext`), the `createGLContext` method will automatically create a browser or headless context depending on the environment, enabling you to write cleaner application code that works both in both environments.
* When working with headless environments, also note that luma.gl has two separate implementations of its IO API functions, `loadImage`/`loadImages`, that work both in browser and under Node.js. (Browser apps tend to rely on the DOM `Image` class to load images, which is not available under Node.js).
