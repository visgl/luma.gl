# @luma.gl/webgl

## WebGL Device Adapter

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/core`).

Simply importing `@luma.gl/webgl` installs the adapter and enables WebGL devices to
be created using `luma.createDevice(props)`. See [`DeviceProps`](../core/device#deviceprops) for WebGL prop options.

```typescript
import {luma} from '@luma.gl/core';
import '@luma.gl/webgl'; // Installs the WebGLDevice adapter

const device = await luma.createDevice({type: 'webgl', canvasContext: {...}, webgl: {...}});

// Resources can now be created
const buffer = device.createBuffer(...);
```

To use a luma.gl WebGL `Device` with raw WebGL calls, the application needs to access
the `WebGL2RenderingContext`. The context is available on the `WebGLDevice` subclass:

```typescript
// @ts-expect-error
const gl = device.gl;
```

With a bit more work, typescript users can retrieve the `WebGL2RenderingContext`
without ignoring type errors:

```typescript
import {cast} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl'; // Installs the WebGLDevice adapter

const webglDevice = cast<WebGLDevice>(device);
const gl = webglDevice.gl;
```
