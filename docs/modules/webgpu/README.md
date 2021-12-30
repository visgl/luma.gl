# @luma.gl/webgpu

## WebGPU Device Adapter

This module contains the WebGPU adapter for the "abstract" luma.gl API (`@luma.gl/api`).

Simply importing `@luma.gl/webgpu` installs the adapter and enables WebGPU devices to
be created using `luma.createDevice(...)`:

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

const device = await luma.createDevice({type: 'webgpu', canvas: ...});

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
import {cast} from '@luma.gl/api';
import {WebGPUDevice} from '@luma.gl/webgpu'; // Installs the WebGPUDevice adapter

const webgpuDevice = cast<WebGPUDevice>(device);
const gl = webgpuDevice.handle;
```
