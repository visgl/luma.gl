# Overview

## WebGPU Device Adapter

This module contains the WebGPU adapter for the "abstract" luma.gl API (`@luma.gl/core`).

The `webgpuAdapter` imported from `@luma.gl/webgpu` enables WebGPU devices to
be created using `luma.createDevice(props)`: See [`CreateDeviceProps`](../core/luma#createdeviceprops) for WebGPU prop options.

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter}'@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

const device = await luma.createDevice({adapters: [webgpuAdapter], canvasContext: {width: 800, height: 600}});

// Resources can now be created
const buffer = device.createBuffer(...);
```

If you are only interested in using WebGPU for compute and not for rendering (or if you want to manually create one or more `CanvasContext`s later), you can also create a WebGPU device without a `CanvasContext`:

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter}'@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

const device = await luma.createDevice({adapters: [webgpuAdapter]});

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
