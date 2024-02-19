# luma


The [`luma`](/docs/api-reference/core/luma) namespace provides luma.gl applications 
with the ability to register GPU Device backends and create `Device` class instances
using the registered backends.

The returned [`Device`](/docs/api-reference/core/device) instances provides luma.gl applications 
with further access to the GPU. 

## luma.registerDevices

```typescript
luma.registerDevices(devices: Device[]): void;
```

Registers one or more devices so that they can be used to create `Device` instances against
that GPU backend.

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgl';
luma.registerDevices([WebGLDevice, WebGPUDevice]);
```

It is possible to register more than one device to create an application
that can work in both WebGL and WebGPU environments. 

```
The `@luma.gl/core` module defines abstract API interfaces such as `Device`, `Buffer` etc and is not usable on its own. 

One or more GPU backend modules must be also be imported from a corresponding GPU API backend module (`@luma.gl/webgl` and/or `@luma.gl/webgpu`) and then registered with luma.gl.


## luma.createDevice

```typescript
luma.createDevice({type, ...DeviceProps});
```

To enable of this, the application create a `Device` using the `'best-available'` adapter.

luma.gl favors WebGPU over WebGL devices, whenever WebGPU is available.

:::note
At least one backend must be imported and registered with `luma.registerDevices()` for `luma.createDevice()` calls to succeed.
:::

## Usage

Create a WebGL2 context, auto creating a canvas

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

luma.registerDevices([WebGLDevice]);
const webglDevice = luma.createDevice({type: 'webgl', canvas: ...});
```

Create a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

luma.registerDevices([WebGLDevice]);
const webgpuDevice = luma.createDevice({type: 'webgl', canvas: ...});
```



## Registering Device Backends


To create a WebGPU device:

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGPUDevice]);
const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```


```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGLDevice, WebGPUDevice]);

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```
