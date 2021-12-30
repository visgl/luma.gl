# @luma.gl/webgl

## WebGL Device Adapter

This module contains the WebGL adapter for the "abstract" luma.gl API (`@luma.gl/api`).

Simply importing `@luma.gl/webgl` installs the adapter and enables WebGL devices to
be created using `luma.createDevice(...)`:

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgl'; // Installs the WebGLDevice adapter

const device = await luma.createDevice({type: 'webgl', canvas: ...});

// Resources can now be created
const buffer = device.createBuffer(...);
```

To use a luma.gl WebGL `Device` with raw WebGL calls, the application needs to access
the `WebGLRenderingContext`. The context is available on the `WebGLDevice` subclass:

```typescript
// @ts-expect-error
const gl = device.gl;
```

With a bit more work, typescript users can retrieve the `WebGLRenderingContext`
without ignoring type errors:

```typescript
import {cast} from '@luma.gl/api';
import {WebGLDevice} from '@luma.gl/webgl'; // Installs the WebGLDevice adapter

const webglDevice = cast<WebGPUDevice>(device);
const gl = webglDevice.gl;
```

## Legacy WebGL classes

This module also exports a set of JavaScript classes for the WebGL2 API,
inherited from the legacy luma.gl v8 API. Note that these classes are considered
deprecated and should be avoided in new code.
