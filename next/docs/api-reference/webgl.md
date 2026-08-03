# @luma.gl/webgl

[Overview](https://luma.gl/next/docs/api-reference/webgl.md)[Constants](https://luma.gl/next/docs/api-reference/webgl/constants.md)

## WebGL Device Adapter[​](#webgl-device-adapter "Direct link to WebGL Device Adapter")

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Importing `webgl2Adapter` from `@luma.gl/webgl` enables WebGL devices to be created using `luma.createDevice(props)`. See [`CreateDeviceProps`](https://luma.gl/next/docs/api-reference/core/luma.md#createdeviceprops) for WebGL property options.

```
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';

const device = await luma.createDevice({
  adapters: [webgl2Adapter],
  createCanvasContext: {width: 800, height: 600}
});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## WebGL Constants[​](#webgl-constants "Direct link to WebGL Constants")

When raw numeric WebGL enums are still needed, import them from [`@luma.gl/webgl/constants`](https://luma.gl/next/docs/api-reference/webgl/constants.md).

## Using with the "raw" WebGL API[​](#using-with-the-raw-webgl-api "Direct link to Using with the \"raw\" WebGL API")

To use a luma.gl WebGL `Device` with raw WebGL calls, the application can access the underlying WebGL handles (`WebGL2RenderingContext`, `WebGLBuffer`, ...) using the `.handle` properties:

```
import type {WebGLDevice} from '@luma.gl/webgl';

const webglDevice = device as WebGLDevice;
const gpuDevice: WebGL2RenderingContext = webglDevice.handle;

const buffer = device.createBuffer(...);
const gpuBuffer: WebGLBuffer = buffer.handle;
```
