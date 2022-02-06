# Device and CanvasContext

The `Device` class initializes, instruments a WebGL contexts.

The `Device` API is similar to the WebGPU `GPUDevice` class.

- Instrument an externally-created context with the same options as `createGLContext`. This performs WebGL 2 polyfilling (which is required for higher-level luma.gl classes) as well as optional state tracking and debug context creation.
- Polyfill a WebGL context integrating available extensions.


## Installing adapters

The `@luma.gl/api` module is not usable on its own. A device adapter module must
be imported (it self registers on import).

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```

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


# CanvasContext

> This class is still experimental

A `CanvasContext` holds a connection between the GPU `Device` and an HTML `canvas` into which it can render.

A `CanvasContext` handles the following responsibilities:
- manages the "swap chain" (provides fresh texture view every frame on WebGPU)
- manages canvas resizing
- manages device pixel ratio
- can look up canvas elements in DOM, or create a new canvas elements if needed

Note that:
- A `WebGPUDevice` can have multiple associated `CanvasContext` instances, or none, if only used for compute.
- A `WebGLDevice` always has exactly one `CanvasContext` (and can thus only render into a single canvas). This is due to fundamental limitations of the WebGL API.

## CanvasContextProps

| Property | Type |
| --- | --- |
| `canvas?` | HTMLCanvasElement \| OffscreenCanvas \| string |
| `width?` | number |
| `height?` | number |
| `useDevicePixels?` | boolean \| number |
| `autoResize?` | boolean |

Remarks:
- `useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down, this happens due to system memory limitation, in such cases a warning will be logged to the browser console. For additional details check device pixels [`document`](<(/docs/api-reference/gltools/device-pixels)>).

