# GPU Initialization

[Overview](https://luma.gl/next/docs/api-guide/gpu.md)[Initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md)[Resources](https://luma.gl/next/docs/api-guide/gpu/gpu-resources.md)[Data Processing](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md)[Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md)

## Adapter[​](#adapter "Direct link to Adapter")

An `Adapter` is a factory for `Device` instances for a specific backend (for example, WebGPU or WebGL).

## Device[​](#device "Direct link to Device")

The [`Device`](https://luma.gl/next/docs/api-reference/core/device.md) class provides luma.gl applications with access to the GPU. A luma.gl application first creates a `Device` instance which in turn provides the application with facilities for creating GPU resources (such as `Buffer` and `Texture` objects), querying GPU capabilities, compiling and linking shaders into pipelines, setting parameters, and of course performing draw and compute calls.

AdapterConcrete devicePortable APIApplication

`webgpuAdapter`@luma.gl/webgpu

`WebGPUDevice`WebGPU backend

`webgl2Adapter`@luma.gl/webgl

`WebGLDevice`WebGL 2 backend

`nullAdapter`@luma.gl/test-utilstest-only

`NullDevice`test-only device

**`Device` portable API**same resource and command surface

**app**`device.createBuffer(...)``device.createTexture(...)`

Adapters create backend-specific `Device` implementations; application code stays on the shared portable API.

## Backend Adapters[​](#backend-adapters "Direct link to Backend Adapters")

The `@luma.gl/core` API is not usable on its own. One or more adapters must also be imported from corresponding GPU API backend modules (`@luma.gl/webgpu` and/or `@luma.gl/webgl`) and provided when creating a `Device`.

To create a WebGPU device:

```
yarn add @luma.gl/core
yarn add @luma.gl/webgpu
```

```
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({
  type: 'webgpu',
  adapters: [webgpuAdapter],
  createCanvasContext: {canvas: ...}
});
```

It is possible to supply more than one device adapter to create an application that can work in both WebGL and WebGPU environments. To create a `Device` using the best available adapter, luma.gl favors WebGPU over WebGL devices whenever WebGPU is available.

```
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const bestAvailableDevice = await luma.createDevice({
  type: 'best-available',
  adapters: [webgpuAdapter, webgl2Adapter],
  createCanvasContext: true
});
console.log(bestAvailableDevice.type); // 'webgpu' or 'webgl' depending on what the browser supports.
```
