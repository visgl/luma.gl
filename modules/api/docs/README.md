# @luma.gl/api

luma.gl provides an abstract API for writing code that works with both WebGPU and WebGL.

The API is modeled after the WebGPU API but is stream-lined to be less cumbersome to use.

## Installing adapters

The `@luma.gl/api` module is not usable on its own. A device adapter must be registered.

```typescript
import {luma} from '@luma.gl/api';
import {WebGPUDevice} from '@luma.gl/webput';
import {WebGLDevice} from '@luma.gl/webgl';

luma.registerDevices([WEBGPUDevice, WebGLDevice]);

const device = luma.createDevice({device: 'webpu', canvas: ...});

...
```
