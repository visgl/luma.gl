# Overview

The `@luma.gl/core` module provides an abstract API that enables application code
to portably work with both WebGPU and WebGL. The main export is the `Device` class
which provides methods for creating GPU resources such as `Buffer`, `Texture`, `Shader` etc.

## Installing adapters

The `@luma.gl/core` module is not usable on its own. A device adapter module must
be imported and provided during device creation.

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter], createCanvasContext: ...});
```

It is possible to supply more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webglAdapter} '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', adapters: [webgpuAdapter, webglAdapter], createCanvasContext: ...});
```

## Creating GPU Resources

Once the application has created a `Device`, GPU resources can be created:

```typescript
const buffer = device.createBuffer(...);
const texture = device.createTexture(...);
const renderPass = device.beginRenderPass(...);
```
