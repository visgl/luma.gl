# createGLContext

Provides functions to create and initialize a WebGL context, and to check for presence of WebGL and extensions.

* Provides the `createGLContext` method which can create WebGLContexts both in browsers and under Node.js.

Note that the use of these functions is NOT required to use the remaining functions and classes in luma.gl.

You could e.g. manually create a WebGLContext by using canvas.getContext, or use a context created by another WebGL library.
In fact, luma.gl is explicitly designed to work with any WebGL context, and in contrast to some other approaches, luma.gl maintains no "hidden state" that might complicate composing your code with other WebGL based modules.


## Usage

Create a WebGL context, autocreating a canvas
```js
import {createGLContext} from '@luma.gl/core';
const gl = createGLContext(); // Prefers WebGL2 but falls back to WebGL1
```

Create a WebGL2 context, failing gracefully if WebGL2 is not supported.
```js
import {createGLContext} from '@luma.gl/core';
const gl = createGLContext({
  webgl1: false,
  throwOnError: false
});
if (!gl) {
  console.error('WebGL2 not supported');
}
```

Create a WebGL context in an existing canvas, setting WebGL context attributes
```js
import {createGLContext} from '@luma.gl/core';
const gl = createGLContext({
  canvas: 'my-canvas-id',
  stencil: true,       // Default render target gets a stencil buffer of at least 8 bits.
  antialias: false,    // Turn of antialiasing
  premultipliedAlpha: false, // turn off pre-multiplied alpha.
  preserveDrawingBuffer: true, // Default render target buffers will not be automatically cleared
});
```

Create a headless WebGL context (under Node.js). `headless-gl` must be installed (`npm install gl`).
```js
import {createGLContext} from '@luma.gl/core';
const gl = createGLContext({width: 100, height: 100});
```


## Methods


### createGLContext

Creates and returns a WebGL context, both in browsers and in Node.js.

```
const gl = createGLContext(options);
```

* `options` (*Object*) - key/value pairs containing context creation options

| Parameter               | Browser default | Headless default | Description |
| ---                     | ---     | ---    | ---         |
| `webgl2`                | `true`  | N/A    | If `true`, will attempt to create a WebGL2 context. Will silently fall back to WebGL1 contexts unless `webgl1` is set to `false`. |
| `webgl1`                | `true`  | `true` | If `true`, will attempt to create a WebGL1 context. The `webgl2` flag has higher priority. |
| `throwOnError`          | `true`  | `true` | Normally `createGLContext` will throw an error on failure. If `false`, it will return `null` instead. |
| `manageState`           | `true`  | `true` | Instrument the context to enable state caching and `withParameter` calls. Leave on unless you have special reasons not to. |
| *Browser-only*            |         |        | |
| `debug`                 | `false` | N/A    | WebGL API calls will be logged to the console and WebGL errors will generate JavaScript exceptions. Note the enabling debug mode has a signficant performance impact. |
| `canvas`                | `null`  | N/A    | A *string* containing the `id` of an existing HTML element or a *DOMElement* instance. If `null` or not provided, a new canvas will be created. |
| `alpha`                 | `true`  | N/A      | Default render target has an alpha buffer. |
| `depth`                 | `true`  | N/A      | Default render target has a depth buffer of at least 16 bits. |
| `stencil`               | `false` | N/A      | Default render target has a stencil buffer of at least 8 bits. |
| `antialias`             | `true`  | N/A      | Boolean that indicates whether or not to perform anti-aliasing. |
| `premultipliedAlpha`    | `true`  | N/A      | Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
| `preserveDrawingBuffer` | `false` | N/A      | Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten |
| `failIfMajorPerformanceCaveat` |`false`| N/A | Do not create if the system performance is low.
| Headless-only           |         |        | |
| `width`                 | N/A     | `800`  | width (*number*) of the headless "virtual screen" render target. Ignored for browser contexts |
| `height`                | N/A     | `600`  | height (*number*) of the headless "virtual screen" render target. Ignored for browser contexts |


## Remarks

* In browser environments, contexts are created via `HTMLCanvasElement.getContext`. If the `webgl2` option is set, this function will first try `webgl2` and then `experimental-webgl2`, before falling back to webgl1.
* In Node.js environments, the context is created using headless-gl. In this case width and height options must be supplied as there is no canvas element to use as reference.
