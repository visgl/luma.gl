# Device and CanvasContext

The [`Device`](../api-reference/device) class provides access to the GPU. 
An luma.gl application first obtains a `Device` provides the 
application with facilities for creating GPU resources 
(such as `Buffer` and `Texture` objects), query GPU capabilities etc.

While a `Device` can be used on its own to perform computations on the GPU,
at least one `CanvasContext` is required for rendering to the screen.
Each `CanvasContext` provides a connection between a `Device` and an `HTMLCanvasElement` (or `OffscreenCanvas`).

## Installing adapters

The `@luma.gl/api` module defines abstract API interfaces such as `Device`, `Buffer` etc and is not usable on its own. 
One or more device "adapter" modules (`@luma.gl/webgl` and `@luma.gl/webgpu`) must be also be imported, 
and the actual resources returned to the application will be created by the adapter.

Create a WebGPU device:

```sh
yarn add @luma.gl/api
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu'; // Note: self registers on import

const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments. To create a `Device` using 
the best available adapter (WebGPU, WebGL 2 and WebGL in that order).

```sh
yarn add @luma.gl/api
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```

## Usage

Create a WebGL2 or WebGL context, auto creating a canvas

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'webgl', canvas: ...});
```

Create a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'webgl2', canvas: ...});
```

## CanvasContext

A [`CanvasContext`](../api-reference/canvas-context) holds a connection between 
the GPU `Device` and an HTML or offscreen `canvas` into which it can render.
A `CanvasContext` takes care of:
- providing a fresh framebuffer every render frame, set up to render into the canvas' swap chain.
- canvas resizing
- device pixel ratio considerations
