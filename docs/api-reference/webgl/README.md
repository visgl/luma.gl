# @luma.gl/webgl

## WebGL Device Adapter

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Importing `webgl2Adapter` from `@luma.gl/webgl` enables WebGL devices to
be created using `luma.createDevice(props)`. See [`CreateDeviceProps`](../core/luma#createdeviceprops) for WebGL property options.

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter}'@luma.gl/webgl';

const device = await luma.createDevice({adapters: [webgl2Adapter], createCanvasContext: {width: 800: height: 600}});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## Using with the "raw" WebGL API

To use a luma.gl WebGL `Device` with raw WebGL calls, the application can access
the underlying WebGL handles (`WebGL2RenderingContext`, `WebGLBuffer`, ...) using the `.handle` properties:

```typescript
import type {WebGLDevice} from '@luma.gl/webgl`;

const webglDevice = device as WebGLDevice;
const gpuDevice: WebGL2RenderingContext = webglDevice.handle;

const buffer = device.createBuffer(...);
const gpuBuffer: WebGLBuffer = buffer.handle;
```
