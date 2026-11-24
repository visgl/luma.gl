---
title: WebGL adapter
description: Use the luma.gl Core API through the WebGL 2 backend and its low-level integration helpers.
---

import {WebGLDocsTabs} from '@site/src/components/docs/webgl-docs-tabs';

# @luma.gl/core/webgl

<WebGLDocsTabs active="overview" />

## WebGL Device Adapter

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Importing `webgl2Adapter` from `@luma.gl/core/webgl` enables WebGL devices to
be created using `luma.createDevice(props)`. See [`CreateDeviceProps`](/docs/api-reference/core/luma#createdeviceprops) for WebGL property options.

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';

const device = await luma.createDevice({
  adapters: [webgl2Adapter],
  createCanvasContext: {width: 800, height: 600}
});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## Optional depth extensions

Check the created WebGL device with `device.features.has(...)`. Extension availability depends on the context and its driver.

| Device feature | WebGL extension | luma.gl setting |
| --- | --- | --- |
| `clip-control-webgl` | [EXT_clip_control](https://registry.khronos.org/webgl/extensions/EXT_clip_control/) | `RenderPassProps.clipDepthMode` selects the projection's clip depth range. |
| `depth-clip-control` | [EXT_depth_clamp](https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/) | Pipeline `unclippedDepth` controls clipping against the near and far planes. |
| `polygon-offset-clamp-webgl` | [EXT_polygon_offset_clamp](https://registry.khronos.org/webgl/extensions/EXT_polygon_offset_clamp/) | Pipeline `depthBiasClamp` bounds the polygon offset. Ordinary polygon offset is available in WebGL 2 core. |

For shared WebGL contexts, set clip origin and depth mode through luma.gl's tracked `setGLParameters` when mixing these settings with render passes. Direct calls on the extension object bypass the tracker. See [Depth buffers](/docs/api-guide/gpu/depth-buffers) for projection examples and WebGPU equivalents.

## WebGL Constants

When raw numeric WebGL enums are still needed, import them from
[`@luma.gl/core/webgl-constants`](/docs/api-reference/webgl/constants).

## Using with the "raw" WebGL API

To use a luma.gl WebGL `Device` with raw WebGL calls, the application can access
the underlying WebGL handles (`WebGL2RenderingContext`, `WebGLBuffer`, ...) using the `.handle` properties:

```typescript
import type {WebGLDevice} from '@luma.gl/core/webgl';

const webglDevice = device as WebGLDevice;
const gpuDevice: WebGL2RenderingContext = webglDevice.handle;

const buffer = device.createBuffer(...);
const gpuBuffer: WebGLBuffer = buffer.handle;
```
