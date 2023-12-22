# GPU Access

## Device

The [`Device`](/docs/api-reference/core/device) class provides luma.gl applications with access to the GPU. 
A luma.gl application first creates a `Device` instance which in turn provides the 
application with facilities for creating GPU resources (such as `Buffer` and `Texture` objects), 
querying GPU capabilities, compiling and linking shaders into pipelines, setting parameters, 
and of course performing draw and compute calls.

While a `Device` can be used on its own to perform computations on the GPU,
at least one `CanvasContext` is required for rendering to the screen.
Each `CanvasContext` provides a connection between a `Device` and an `HTMLCanvasElement` (or `OffscreenCanvas`).

## CanvasContext

The [`CanvasContext`](/docs/api-reference/core/canvas-context) is an important companion to the `Device`. A `CanvasContext` holds a connection between the GPU `Device` and an HTML or offscreen `canvas` into which it can render.

A `CanvasContext` takes care of:

- providing a fresh `Framebuffer` every render frame, set up to render into the canvas' swap chain.
- canvas resizing
- device pixel ratio calculations

## Usage

Create a WebGL2 or WebGL context, auto creating a canvas

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

luma.registerDevices([WebGLDevice]);
const webgpuDevice = luma.createDevice({type: 'webgl', canvas: ...});
```

Create a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

luma.registerDevices([WebGLDevice]);
const webgpuDevice = luma.createDevice({type: 'webgl2', canvas: ...});
```

## Registering Device Backends

The `@luma.gl/core` module defines abstract API interfaces such as `Device`, `Buffer` etc and is not usable on its own. 

One or more GPU backend modules must be also be imported from a corresponding GPU API backend module (`@luma.gl/webgl` and/or `@luma.gl/webgpu`) and then registered with luma.gl.

To create a WebGPU device:

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGPUDevice]);
const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments. To create a `Device` using 
the best available adapter (luma.gl favors WebGPU, WebGL 2 and WebGL 1 devices, in that order).

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGLDevice, WebGPUDevice]);

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```
