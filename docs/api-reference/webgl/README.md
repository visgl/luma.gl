import {WebGLDocsTabs} from '@site/src/components/docs/webgl-docs-tabs';

# @luma.gl/webgl

<WebGLDocsTabs active="overview" />

## WebGL Device Adapter

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Importing `webgl2Adapter` from `@luma.gl/webgl` enables WebGL devices to
be created using `luma.createDevice(props)`. See [`CreateDeviceProps`](/docs/api-reference/core/luma#createdeviceprops) for WebGL property options.

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';

const device = await luma.createDevice({
  adapters: [webgl2Adapter],
  createCanvasContext: {width: 800, height: 600}
});

// Resources can now be created
const buffer = device.createBuffer(...);
```

## WebGL Constants

When raw numeric WebGL enums are still needed, import them from
[`@luma.gl/webgl/constants`](/docs/api-reference/webgl/constants).

## Using with the "raw" WebGL API

To use a luma.gl WebGL `Device` with raw WebGL calls, the application can access
the underlying WebGL handles (`WebGL2RenderingContext`, `WebGLBuffer`, ...) using the `.handle` properties:

```typescript
import type {WebGLDevice} from '@luma.gl/webgl';

const webglDevice = device as WebGLDevice;
const gpuDevice: WebGL2RenderingContext = webglDevice.handle;

const buffer = device.createBuffer(...);
const gpuBuffer: WebGLBuffer = buffer.handle;
```

## Extension-backed WebGL APIs

Check `device.features` before using optional extension-backed behavior. WebGL-only public names
carry a `-webgl` suffix when they appear in shared string unions.

```typescript
if (webglDevice.features.has('clip-control-webgl')) {
  webglDevice.setClipControlWebGL({
    origin: 'upper-left',
    depthMode: 'zero-to-one'
  });
}
```

`WEBGLRenderPass.multiDrawArrays()` and `multiDrawElements()` require `multi-draw-webgl`, an
active pipeline, bindings, and vertex array. They do not silently emulate multi-draw with a loop.
`stencil-only` texture views require `stencil-texturing-webgl`, and WebGL cannot bind conflicting
depth/stencil aspects of one texture in the same draw because the mode is texture-global.

Shader-only extensions are reported as features such as `shader-sample-variables-webgl` and
`shader-multisample-interpolation-webgl`. Applications and shader modules still author their own
GLSL `#extension` directives.
