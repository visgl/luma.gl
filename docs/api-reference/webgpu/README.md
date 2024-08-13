# Overview

## WebGPU Device Adapter

This module contains the WebGPU adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Simply importing `@luma.gl/webgpu` installs the adapter and enables WebGPU devices to
be created using `luma.createDevice(props)`: See [`DeviceProps`](../core/device#deviceprops) for WebGPU prop options.

```typescript
import {luma} from '@luma.gl/core';
import '@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

const device = await luma.createDevice({type: 'webgpu', canvasContext: {...}});

// Resources can now be created
const buffer = device.createBuffer(...);
```

To use a luma.gl WebGPU `Device` with raw WebGPU calls, the application needs to access
the `GPUDevice`. The raw WebGPU handle is available on the `WebGPUDevice` subclass:

```typescript
// @ts-expect-error
const gl = device.handle;
```

With a bit more work, typescript users can retrieve the `WebGLRenderingContext`
without ignoring type errors:

```typescript
import {Device, cast} from '@luma.gl/core';
import {WebGPUDevice} from '@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

function f(device: Device) {
  const webgpuDevice = device as WebGPUDevice;
  const gpuDevice: GPUDevice = webgpuDevice.handle; // Get underlying WebGPU device
  ...
}
```
