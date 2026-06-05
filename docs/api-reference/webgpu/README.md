# Overview

## WebGPU Device Adapter

This module contains the WebGPU adapter for the "abstract" luma.gl API (`@luma.gl/core`).

The `webgpuAdapter` imported from `@luma.gl/webgpu` enables WebGPU devices to
be created using `luma.createDevice(props)`: See [`CreateDeviceProps`](/docs/api-reference/core/luma#createdeviceprops) for WebGPU prop options.

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({adapters: [webgpuAdapter], createCanvasContext: {width: 800, height: 600}});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## Feature levels

WebGPU devices default to the WebGPU core feature level:

```typescript
const device = await luma.createDevice({
  type: 'webgpu',
  adapters: [webgpuAdapter],
  featureLevel: 'core'
});
```

Applications that need the previous "request every supported feature and limit" behavior can opt in:

```typescript
const device = await luma.createDevice({
  type: 'webgpu',
  adapters: [webgpuAdapter],
  featureLevel: 'max'
});
```

Read `device.info.featureLevel` to see the effective level and use
`device.limits` when selecting optional paths such as vertex-stage storage
buffers. For assembled WGSL, shadertools also exposes
`LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS`; see
[WGSL Support](/docs/api-reference/shadertools/wgsl-support).

## Using for compute only

If you are only interested in using WebGPU for compute and not for rendering (or if you want to manually create one or more `CanvasContext`s later), you can also create a WebGPU device without a `CanvasContext`:

```typescript
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({adapters: [webgpuAdapter]});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## Using with the "raw" WebGPU API

To use a luma.gl WebGPU `Device` with raw WebGPU calls, the application can access
the underlying WebGPU handles (`GPUDevice`, `GPUBuffer`, ...) using the `.handle` properties:

```typescript
import type {WebGPUDevice} from '@luma.gl/webgpu`;

const webgpuDevice = device as WebGPUDevice;
const gpuDevice: GPUDevice = webgpuDevice.handle;

const buffer = device.createBuffer(...);
const gpuBuffer: GPUBuffer = buffer.handle;
```
