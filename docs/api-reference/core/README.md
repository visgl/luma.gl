# Overview

The `@luma.gl/core` module provides an abstract API that enables application code
to portably work with both WebGPU and WebGL. The main export is the `Device` class
which provides methods for creating GPU resources such as `Buffer`, `Texture`, `Shader` etc.

## Installing adapters

The `@luma.gl/core` module is not usable on its own. A device adapter module must
be imported and registered.

```typescript
import {luma} from '@luma.gl/core';
import {WebGPUAdapter} from '@luma.gl/webgpu';

luma.registerDevice([WebGPUAdapter])
const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
luma.registerDevice([WebGPUAdapter])
import {luma} from '@luma.gl/core';
import {WebGPUAdapter} from '@luma.gl/webgpu';
import {WebGLAdapter} '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```

## Creating GPU Resources

Once the application has created a `Device`, GPU resources can be created:

```typescript
const buffer = device.createBuffer(...)
```

## Accessing the CanvasContext

A `Device` may (optinally) be used to render in one or more canvases (HTML canvas elements).
The connection between a Device and a canvas is managed by the `CanvasContext` class.

:::info
In WebGL there is always exactly one canvas associated with the device and it is not
possible to create a canvas-less context or render into multiple contexts.
:::
