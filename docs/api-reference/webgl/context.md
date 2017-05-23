# Context Management

Provides functions to create and initialize a WebGL context, and to check for presence of WebGL and extensions.

* Provides the `createGLContext` method which can create WebGLContexts both in browsers and under Node.js.
* Also provides `getGLExtension` that throws an `Error` if the requested extension cannot be returned.

Note that the use of these functions is NOT required to use the remaining functions and classes in luma.gl.

You could e.g. manually create a WebGLContext by using canvas.getContext, or use a context created by another WebGL library.
In fact, luma.gl is explicitly designed to work with any WebGL context, and in contrast to some other approaches, luma.gl maintains no "hidden state" that might complicate composing your code with other WebGL based modules.


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

* `canvas` (*string*|*DOMElement*, required for browser contexts, ignored for headless contexts) Can be a string with the canvas id or the canvas element itself.
* `width` (*number*, required for headless contexts, ignored for browser contexts) - width of the "virtual screen" render target
* `height` (*number*, required for headless contexts, ignored for browser contexts) - height of the "virtual screen" render target
* `debug` (*boolean*, `true`) - Unless set to false, all gl calls will be `console.log`-ged and errors thrown to the console. Note that catching webgl errors has a performance impact as it requires a GPU sync after each operation, so make sure to pass `false` in production environments.
* `webgl2` (*boolean*, `false`) - If true, will attempt to create a WebGL2 context (not supported on headless environments). Will fall back to WebGL1 contexts. Use `gl instanceof WebGL2RenderingContext` to determine what type of context was actually returned.
* `webgl2`=`false` (*boolean*) - If `true`, will attempt to create a WebGL2 context (not supported on headless environments). Will fall back to WebGL1 contexts if `webgl1` is true. Use `isWebGL2` or `getCaps` to determine what type of context was actually returned.
* `webgl1`=`true` (*boolean*) - If `true`, will attempt to create a WebGL1 context. Set to false if `webgl2` is `true` to force failure on `webgl2` contexts.
* `throwOnError`=`true` (*boolean*) - Normally `createGLContext` will throw an error on failure. With this flag set, it will return `null` instead.
* `headlessGL` (*function*, null) - In Node.js environments, contexts are created using [headless-gl](https://www.npmjs.com/package/gl). To avoid including the `headless-gl` module in applications that don't use it, luma.gl requires the app to install and import headless-gl itself, and pass headless-gl as an argument to `createGLContext`.


### getExtension

More info [here](http://www.khronos.org/registry/webgl/extensions/).

`getGLExtension(gl, name);`

* `gl` (`WebGLRenderingContext`) - gl context
* `name` (`String`) - The name of the extension.

Returns the WebGL extension with the given name, for example `OES_texture_float`.
Throws an Error if the extension is not available.


### clear

Clears the drawing buffer (the default framebuffer) or the currently bound framebuffer.




## Remarks

* In browser environments, contexts are created via `HTMLCanvasElement.getContext`, first using `webgl` and then falls back to `experimental-webgl`. If `webgl2` option is set, this function will first try `webgl2` and then `experimental-webgl2`, before falling back to webgl1.
* In Node.js environments, the context is created using headless-gl. In this case width and height options must be supplied as there is no canvas element to use as reference.
