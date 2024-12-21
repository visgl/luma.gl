# GPU Initialization

## Adapter

An `Adapter` is a factory for `Device` instances for a specific backend (e.g. WebGPU or WebGL).

## Device

The [`Device`](/docs/api-reference/core/device) class provides luma.gl applications with access to the GPU. 
A luma.gl application first creates a `Device` instance which in turn provides the 
application with facilities for creating GPU resources (such as `Buffer` and `Texture` objects), 
querying GPU capabilities, compiling and linking shaders into pipelines, setting parameters, 
and of course performing draw and compute calls.

## Backend Adapters

The `@luma.gl/core` API is not usable on its own. One or more GPU backend modules 
must be also be imported from a corresponding GPU API backend module (`@luma.gl/webgpu` and/or `@luma.gl/webgl`). 
and provided when creating a `Device`.

To create a WebGPU device:

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter], createCanvasContext: {canvas: ...}});
```

It is possible to supply more than one device adapter to create an application
that can work in both WebGL and WebGPU environments. To create a `Device` using 
the best available adapter (luma.gl favors WebGPU over WebGL devices, whenever WebGPU is available).

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const bestAvailableDevice = luma.createDevice({type: 'best-available', adapters: [webglAdapter, webgpuAdapter], createCanvasContext: true});
console.log(device.type); // 'webgpu' or 'webgl' depending on what the browser supports.
```
