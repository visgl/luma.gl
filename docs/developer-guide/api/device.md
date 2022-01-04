# Device

The `Device` class initializes, instruments a WebGL contexts.

The `Device` API is similar to the WebGPU `GPUDevice` class.

- Instrument an externally-created context with the same options as `createGLContext`. This performs WebGL 2 polyfilling (which is required for higher-level luma.gl classes) as well as optional state tracking and debug context creation.
- Polyfill a WebGL context integrating available extensions.


## Usage

Create a WebGL2 or WebGL context, auto creating a canvas

```typescript
import {Device} from '@luma.gl/gltools';
const device = new Device(); // Prefers WebGL 2 but falls back to WebGL 1
```

Create a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {Device} from '@luma.gl/gltools';
const device = createGLContext({
  webgl1: false,
});
```

Attaching a Device to an externally created WebGLRendering context instruments it
so that it works with other luma.gl classes.

```typescript
import {Device} from '@luma.gl/gltools';
import {Model} from '@luma.gl/engine';

const device = Device.attach(gl); // "instruments" the external context

// Instrumentation ensures the context works with higher-level classes.
const model = new Model(gl, options);
```

Attaching a device to a WebGL1 context adds WebGL2 "polyfills" to the WebGLRendering context
extends that context with a subset of WebGL2 APIs that are available via WebGL extensions.

```typescript
const gl = canvas.createContext('webgl'); // A WebGL 1 context
const device = Device.attach(gl);

// Can now use a subset of WebGL2 APIs on
const vao = device.gl.createVertexArray();
```

## Fields

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

### info

Get debug information about a WebGL context. Depends on `WEBGL_debug_renderer_info` extension.

Returns (Object):

- **vendor**: GPU vendor (unmasked if possible)
- **renderer**: Renderer (unmasked if possible)
- **vendorMasked**: Masked GPU vendor
- **rendererMasked**: Masked renderer
- **version**: WebGL version
- **shadingLanguageVersion**: shading language version



## Functions

### constructor(props?: WebGLDeviceProps)

Creates and returns a WebGL context, both in browsers and in Node.js.

```typescript
const device = new Device(props);
```

- `props` (_Object_) - key/value pairs containing context creation options

| Parameter                      | Default     | Description                                                                                                                                                                   |
| ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas`                       | `null`      | A _string_ containing the `id` of an existing HTML element or a _DOMElement_ instance. If `null` or not provided, a new canvas will be created.                               |
| `webgl2?: boolean`                       | `true`      | If `true`, will attempt to create a WebGL 2 context. Will silently fall back to WebGL 1 contexts unless `webgl1` is set to `false`.                                           |
| `webgl1?: boolean`                       | `true`      | If `true`, will attempt to create a WebGL 1 context. The `webgl2` flag has higher priority.                                                                                   |
| `debug?: boolean`                        | `false`     | WebGL API calls will be logged to the console and WebGL errors will generate JavaScript exceptions. **NOTE:** requires importing [@luma.gl/debug](/docs/api-reference/debug). |
| `break?: string[]`                        | `[]`        | Insert a break point (`debugger`) if one of the listed gl functions is called.                                                                                                |
| `manageState?: boolean`                  | `true`      | Instrument the context to enable state caching and `withParameter` calls. Leave on unless you have special reasons not to.                                                    |
| `onContextLost?: Function`                | `undefined` | A handler for webglcontextlost event that is fired if the user agent detects that the drawing buffer associated with a WebGLRenderingContext object has been lost.            |
| `onContextRestored?: Function`            | `undefined` | A handler for webglcontextrestored event that is fired if the user agent restores the drawing buffer for a WebGLRenderingContext object.                                      |
| `alpha?: boolean`                        | `true`      | Default render target has an alpha buffer.                                                                                                                                    |
| `depth?: boolean`                        | `true`      | Default render target has a depth buffer of at least 16 bits.                                                                                                                 |
| `stencil?`                      | `false`     | Default render target has a stencil buffer of at least 8 bits.                                                                                                                |
| `antialias?`                    | `true`      | Boolean that indicates whether or not to perform anti-aliasing.                                                                                                               |
| `premultipliedAlpha?`           | `true`      | Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.                                                     |
| `preserveDrawingBuffer?`        | `false`     | Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten                                                   |
| `failIfMajorPerformanceCaveat?` | `false`     | Do not create if the system performance is low.                                                                                                                               |


### resize

Resize the drawing surface.

```
resizeGLContext(gl, options);
```

- `gl` (_Object_) - A WebGL context.
- `options` (_Object_) - key/value pairs containing resize options.
  - **width**: New drawing surface width.
  - **height**: New drawing surface height.
  - **useDevicePixels**: Whether to scale the drawing surface using the device pixel ratio.
