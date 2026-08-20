---
title: Initialize a GPU device
description: Register the backends your application supports, create a device, and select feature-dependent paths from reported capabilities.
---

import {AdapterBackendGraphic} from '@site/src/components/docs/adapter-backend-graphic';
import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Initialize a GPU device

<GpuGuideDocsTabs group="lifecycle" active="initialization" />

## Outcome

Every luma.gl GPU workflow begins with a `Device`. The application registers the backend
adapters it is prepared to use, asks luma.gl for a compatible device, and then selects feature
paths from that device’s reported capabilities.

Do not infer capabilities from the browser or operating system. The created device is the
contract for this session.

## Mental model

- An **adapter** integrates one backend—currently WebGPU or WebGL 2—and creates matching device
  instances.
- A **device** is the application-facing GPU connection. It creates resources, reports features
  and limits, records or begins commands, submits work, and owns presentation state.
- A **canvas context** is optional. Compute-only applications can create a device without one;
  rendered applications connect the device to a canvas.

<AdapterBackendGraphic />

`@luma.gl/core` defines the portable interfaces but does not silently import a backend. This
keeps bundle and compatibility choices explicit.

## Create a WebGPU device

Install Core and the WebGPU adapter:

```sh
yarn add @luma.gl/core @luma.gl/webgpu
```

```ts
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({
  type: 'webgpu',
  adapters: [webgpuAdapter],
  createCanvasContext: {canvas}
});
```

This request fails rather than falling back when WebGPU cannot satisfy it. Use this form when
the application requires compute shaders, storage resources, indirect work, or another
WebGPU-only capability.

## Create the best available portable device

Register both adapters when the application has WebGPU and WebGL 2 implementations:

```sh
yarn add @luma.gl/core @luma.gl/webgpu @luma.gl/webgl
```

```ts
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';

const device = await luma.createDevice({
  type: 'best-available',
  adapters: [webgpuAdapter, webgl2Adapter],
  createCanvasContext: {canvas}
});

console.log(device.type); // 'webgpu' or 'webgl'
```

`best-available` prefers WebGPU when it is usable and otherwise selects WebGL 2. Registering a
fallback does not make WGSL, compute, storage buffers, or other WebGPU-only code portable; the
application must still provide a supported path for the selected device.

## Select a capability-dependent path

After creation:

1. Check `device.info.type` or `device.type` when the implementation differs by backend.
2. Check `device.features` before using an optional feature.
3. Check `device.limits` before allocating large resources or choosing workgroup and binding
   sizes.
4. Create shaders, layouts, and resources that match that selected path.

See [Device information](/docs/api-reference/core/device-info),
[features](/docs/api-reference/core/device-features), and
[limits](/docs/api-reference/core/device-limits) for the exact surfaces.

## Common mistakes

- Importing only `@luma.gl/core` and expecting it to discover backend packages.
- Requesting `best-available` while providing only WGSL or other WebGPU-only behavior.
- Allocating from assumed desktop limits instead of the created device’s limits.
- Creating multiple devices merely to separate renderers that could share resources and a
  submission queue.
- Forgetting to destroy the device and application-owned resources during teardown.

## Next steps

- [Create and own GPU resources](/docs/api-guide/gpu/gpu-resources).
- [Understand GPU memory and transfer cost](/docs/api-guide/gpu/gpu-memory).
- [Review the exact `Device` API](/docs/api-reference/core/device).
