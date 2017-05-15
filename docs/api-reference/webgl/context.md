# Context Management

Provides functions to create and initialize a WebGL context, and to check for presence of WebGL and extensions.

* Provides the `createGLContext` method which can create WebGLContexts both in browsers and under Node.js.
* Also provides `getGLExtension` that throws an `Error` if the requested extension cannot be returned.

Note that the use of these functions is NOT required to use the remaining
functions and classes in luma.gl.

You could e.g. manually create a WebGLContext by using canvas.getContext,
or use a context created by another WebGL library.
In fact, luma.gl is explicitly designed to work with any WebGL context, and
in contrast to some other approaches, luma.gl maintains no "hidden state"
that might complicate composing your code with other WebGL based modules.


## Usage

```js
import headlessGL from 'gl';
import {createGLContext} from 'luma.gl';
const gl = createGLContext({headlessGL})
```


## Functions

### createGLContext

Creates and returns a WebGL context, both in browsers and in Node.js.

```
  const gl = createGLContext(options);
```

* **canvas** (*string*|*DOMElement*, required for browser contexts, ignored for headless contexts) Can be a string with the canvas id or the canvas element itself.
* **width** (*number*, required for headless contexts, ignored for browser contexts) - width of the "virtual screen" render target
* **height** (*number*, required for headless contexts, ignored for browser contexts) - height of the "virtual screen" render target
* **debug** (*boolean*, `true`) - Unless set to false, all gl calls will be `console.log`-ged and errors thrown to the console. Note that catching webgl errors has a performance impact as it requires a GPU sync after each operation, so make sure to pass `false` in production environments.
* **webgl2** (*boolean*, `false`) - If true, will attempt to create a WebGL2 context (not supported on headless environments). Will fall back to WebGL1 contexts. Use `gl instanceof WebGL2RenderingContext` to determine what type of context was actually returned.
* **headlessGL** (*function*, null) - In Node.js environments, contexts are created using [headless-gl](https://www.npmjs.com/package/gl). To avoid including the `headless-gl` module in applications that don't use it, luma.gl requires the app to install and import headless-gl itself, and pass headless-gl as an argument to `createGLContext`.


### getGLExtension

Returns the WebGL extension with the given name,
For example `OES_texture_float`.
Throws an Error if the extension is not available.

More info [here](http://www.khronos.org/registry/webgl/extensions/).

### Syntax:

  getGLExtension(gl, name);


### Arguments:

1. **name** (*string*) - The name of the extension.


## Remarks

* In browser environments, contexts are created via canvas.getContext, first using `webgl` and then falls back to `experimental-webgl`. If `webgl2` option is set, this function will first try `webgl2` and then `experimental-webgl2`, before falling back to webgl1.
* In Node.js environments, the context is created using headless-gl. In this case width and height options must be supplied as there is no canvas element to use as reference.
* While you can certainly use [headless-gl](https://www.npmjs.com/package/gl) directly to create a context (without passing it to `createGLContext`), the `createGLContext` method will automatically create a browser or headless context depending on the environment, enabling you to write cleaner application code that works both in both environments.
* When working with headless environments, also note that luma.gl has two separate implementations of its IO API functions, `loadImage`/`loadImages`, that work both in browser and under Node.js. (Browser apps tend to rely on the DOM `Image` class to load images, which is not available under Node.js).
