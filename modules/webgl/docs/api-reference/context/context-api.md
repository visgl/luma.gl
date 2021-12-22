# Context Management

Functions to initialize, instrument and manipulate WebGL contexts.

## Usage

Create a WebGL context, autocreating a canvas

```js
import {createGLContext} from '@luma.gl/gltools';
const gl = createGLContext(); // Prefers WebGL 2 but falls back to WebGL 1
```

Create a WebGL 2 context.

```js
import {createGLContext} from '@luma.gl/gltools';
const gl = createGLContext({
  webgl1: false,
  throwOnError: false
});
if (!gl) {
  console.error('WebGL 2 not supported');
}
```

Polyfill a WebGL context with features available in extensions.

```js
import {polyfillContext} from '@luma.gl/gltools';

const gl = canvas.createContext('webgl'); // A WebGL 1 context
polyfillContext(gl);

// Using extension via WebGL 2 API
const vao = gl.createVertexArray();
```

Instrument an externally-created context to work with other luma.gl classes.

```js
import {instrumentGLContext} from '@luma.gl/gltools';
import {Model} from '@luma.gl/engine';

const gl = canvas.createContext('webgl');

instrumentGLContext(gl);

// Instrumentation ensures the context works with higher-level classes.
const model = new Model(gl, options);
```

## Functions

### createGLContext

Creates and returns a WebGL context, both in browsers and in Node.js.

```
const gl = createGLContext(options);
```

- `options` (_Object_) - key/value pairs containing context creation options

| Parameter                      | Default     | Description                                                                                                                                                                   |
| ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webgl2`                       | `true`      | If `true`, will attempt to create a WebGL 2 context. Will silently fall back to WebGL 1 contexts unless `webgl1` is set to `false`.                                           |
| `webgl1`                       | `true`      | If `true`, will attempt to create a WebGL 1 context. The `webgl2` flag has higher priority.                                                                                   |
| `throwOnError`                 | `true`      | Normally the context will throw an error on failure. If `false`, it will log to console instead.                                                                              |
| `break`                        | `[]`        | Insert a break point (`debugger`) if one of the listed gl functions is called.                                                                                                |
| `manageState`                  | `true`      | Instrument the context to enable state caching and `withParameter` calls. Leave on unless you have special reasons not to.                                                    |
| `debug`                        | `false`     | WebGL API calls will be logged to the console and WebGL errors will generate JavaScript exceptions. **NOTE:** requires importing [@luma.gl/debug](/docs/api-reference/debug). |
| `onContextLost`                | `undefined` | A handler for webglcontextlost event that is fired if the user agent detects that the drawing buffer associated with a WebGLRenderingContext object has been lost.            |
| `onContextRestored`            | `undefined` | A handler for webglcontextrestored event that is fired if the user agent restores the drawing buffer for a WebGLRenderingContext object.                                      |
| `canvas`                       | `null`      | A _string_ containing the `id` of an existing HTML element or a _DOMElement_ instance. If `null` or not provided, a new canvas will be created.                               |
| `alpha`                        | `true`      | Default render target has an alpha buffer.                                                                                                                                    |
| `depth`                        | `true`      | Default render target has a depth buffer of at least 16 bits.                                                                                                                 |
| `stencil`                      | `false`     | Default render target has a stencil buffer of at least 8 bits.                                                                                                                |
| `antialias`                    | `true`      | Boolean that indicates whether or not to perform anti-aliasing.                                                                                                               |
| `premultipliedAlpha`           | `true`      | Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.                                                     |
| `preserveDrawingBuffer`        | `false`     | Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten                                                   |
| `failIfMajorPerformanceCaveat` | `false`     | Do not create if the system performance is low.                                                                                                                               |

### instrumentGLContext

Instrument an externally-created context with the same options as `createGLContext`. This performs WebGL 2 polyfilling (which is required for higher-level luma.gl classes) as well as optional state tracking and debug context creation.

```
instrumentGLContext(gl, options);
```

- `gl` (_Object_) - An externally-created WebGL context.
- `options` (_Object_) - key/value pairs containing context creation options (same as for `createGLContext`).

### polyfillContext

Polyfill a WebGL context integrating available extensions.

```js
polyfillContext(gl);
```

- `gl` {WebGLRenderingContext} - A WebGL context

### resizeGLContext

Resize the drawing surface.

```
resizeGLContext(gl, options);
```

- `gl` (_Object_) - A WebGL context.
- `options` (_Object_) - key/value pairs containing resize options.
  - **width**: New drawing surface width.
  - **height**: New drawing surface height.
  - **useDevicePixels**: Whether to scale the drawing surface using the device pixel ratio.

### getContextDebugInfo

Get debug information about a WebGL context. Depends on `WEBGL_debug_renderer_info` extension.

`getContextDebugInfo(gl)`

- `gl` (_Object_) - A WebGL context.

Returns (Object):

- **vendor**: GPU vendor (unmasked if possible)
- **renderer**: Renderer (unmasked if possible)
- **vendorMasked**: Masked GPU vendor
- **rendererMasked**: Masked renderer
- **version**: WebGL version
- **shadingLanguageVersion**: shading language version

### isWebGL

Test if an object is a WebGL 1 or 2 context, including correctly identifying a luma.gl debug context (which is not a subclass of a `WebGLRendringContext`).

`isWebGL(gl)`

- `gl` (Object) - Object to test.
  Returns true if the context is a WebGL 1 or 2 Context.

### isWebGL2

Test if an object is a WebGL 1 or 2 context, including correctly identifying a luma.gl debug context (which is not a subclass of a `WebGL2RendringContext`).

`isWebGL2(gl)`

- `gl` (Object) - Object to test.
  Returns true if the context is a WebGL 2 Context.
