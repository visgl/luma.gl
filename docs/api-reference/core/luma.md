# luma


The [`luma`](/docs/api-reference/core/luma) namespace provides luma.gl applications 
with the ability to register GPU Device backends and create `Device` class instances
using the registered backends.

The returned [`Device`](/docs/api-reference/core/device) instances provides 
luma.gl applications with a complete GPU API. 

## Device Registration

The `@luma.gl/core` module defines abstract API interfaces such as `Device`, `Buffer` etc and is not usable on its own. 

One or more GPU backend modules must be imported from a corresponding 
GPU API backend module (`@luma.gl/webgl` and/or `@luma.gl/webgpu`) and then registered with luma.gl.

## Usage

To register a device backend, import the corresponding device backend module and then call `luma.registerDevices()`

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
luma.registerDevices([WebGLDevice]);
```

It is possible to register more than one device to create an application
that can work in both WebGL and WebGPU environments. 

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgl';
luma.registerDevices([WebGLDevice, WebGPUDevice]);
```

Register the WebGL backend, then create a WebGL2 context, auto creating a canvas

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

Install device modules

```sh
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

To create a WebGPU device:

```typescript
import {luma} from '@luma.gl/core';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGPUDevice]);
const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

Pre-register devices

```typescript
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGLDevice, WebGPUDevice]);
const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```

Provide devices to createDevice

```typescript
const webgpuDevice = luma.createDevice({
  type: 'best-available', 
  canvas: ..., 
  devices: [WebGLDevice, WebGPUDevice]
});
```

## Types

### `CreateDeviceProps`

Properties for creating a new device

```ts
type CreateDeviceProps = DeviceProps & {
  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  /** List of device types. Will also search any pre-registered device backends */
  devices?: DeviceFactory[];
}
```

### `AttachDeviceProps`

Properties for attaching an existing WebGL context or WebGPU device to a new luma Device.

```ts
export type AttachDeviceProps = DeviceProps & {
  /** Externally created WebGL context or WebGPU device */
  handle: WebGL2RenderingContext | GPUDevice | null;
  /** List of device types. Will also search any pre-registered device backends */
  devices?: DeviceFactory[];
};
```

## Methods

### `luma.createDevice()`

```typescript
luma.createDevice({type, devices, ...deviceProps}: CreateDeviceProps);
```

To create a Device instance, the application calls `luma.createDevice()`.

- `type`: `'webgl' \| 'webgpu' \| 'best-available'`
- `devices`: list of `Device` backend classes. Can be omitted if `luma.registerDevices()` has been called.

Unless a device `type` is specified a `Device` will be created using the `'best-available'` adapter.
luma.gl favors WebGPU over WebGL devices, whenever WebGPU is available.

Note: A device type is available if:
1. The backend module has been registered
2. The browser supports that GPU API

### `luma.attachDevice()`

```ts
luma.attachDevice({handle: WebGL2RenderingContext | GPUDevice, devices, ...}: AttachDeviceProps);
```

A luma.gl Device can be attached to an externally created `WebGL2RenderingContext` or `GPUDevice`.
This allows applications to use the luma.gl API to "interleave" rendering with other GPU libraries.

- `handle` - The externally created `WebGL2RenderingContext` or `GPUDevice` that should be attached to a luma `Device`.
- `devices` - list of `Device` backend classes. Can be omitted if `luma.registerDevices()` has been called.

Note that while you cannot directly attach a luma.gl `Device` to a WebGL 1 `WebGLRenderingContext`, you may be able to work around it using `luma.enforceWebGL2()`.

### `luma.registerDevices()`

```typescript
luma.registerDevices(devices?: (typeof Device)[]): void;
```

Registers one or more devices (device constructors) so that they can be used 
to create `Device` instances against that GPU backend. The registered device types
will be available to `luma.createDevice()` and `luma.attachDevice()` calls.

`luma.registerDevices()` enables separation of the application code that 
registers GPU backends from the application code that creates devices,
so that device types do not have to be provided at `Device` create or attach time.

### `luma.enforceWebGL2()`

```ts
luma.enforceWebGL2(enforce: boolean = true);
```

Overrides `HTMLCanvasElement.prototype.getContext()` to return WebGL2 contexts even when WebGL1 context are requested. Reversible with `luma.enforceWebGL2(false);`

Since luma.gl only supports WebGL2 contexts (`WebGL2RenderingContext`), it is not possible to call`luma.attachDevice()` on a WebGL1 context (`WebGLRenderingContext`).

This becomes a problem when using luma.gl with a WebGL library that always creates WebGL1 contexts (such as Mapbox GL JS v1).
Calling `luma.enforceWebGL2()` before initializing the external library makes that library create a WebGL2 context, that luma.gl can then attach a Device to.

:::caution
Since WebGL2 is a essentially a superset of WebGL1, a library written for WebGL 1 will often still work with a WebGL 2 context. However there may be issues if the external library relies on WebGL1 extensions that are not available in WebGL2. To make a WebGL 2 context support WebGL1-only extensions, those extensions would also need to be emulated on top of the WebGL 2 API, and this is not currently done.
:::

## Remarks

- At least one backend must be imported and registered with `luma.registerDevices()` for `luma.createDevice()` or `luma.attachDevice()` calls to succeed (unless `Device` implementations are supplied to those calls).
