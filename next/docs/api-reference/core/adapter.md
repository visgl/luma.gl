# Adapter

[luma](https://luma.gl/next/docs/api-reference/core/luma.md)[Adapter](https://luma.gl/next/docs/api-reference/core/adapter.md)[Device](https://luma.gl/next/docs/api-reference/core/device.md)[DeviceInfo](https://luma.gl/next/docs/api-reference/core/device-info.md)[DeviceLimits](https://luma.gl/next/docs/api-reference/core/device-limits.md)[DeviceFeatures](https://luma.gl/next/docs/api-reference/core/device-features.md)

From v9.1

An `Adapter` is a factory that creates [`Device`](https://luma.gl/next/docs/api-reference/core/device.md) instances for a specific backend (e.g. WebGPU or WebGL). Each GPU backend exports a singleton adapter instance that is used to create devices for that GPU backend.

Adapters can be used directly to create and attach devices, but they are usually imported and used via the [`luma`](https://luma.gl/next/docs/api-reference/core/luma.md) API through methods like \[`luma.createDevice`].

Note: an adapter may perform asynchronous loading of adapter code, debug libraries, etc before creating the `Device`.

## Usage[​](#usage "Direct link to Usage")

Register the WebGL backend, then create a WebGL2 context, auto creating a canvas

```
import {luma} from '@luma.gl/core';

import {webgl2Adapter} from '@luma.gl/webgl';

luma.registerAdapters([webgl2Adapter]);

const webglDevice = await luma.createDevice({type: 'webgl', createCanvasContext: ...});
```

## Members[​](#members "Direct link to Members")

### `type`[​](#type "Direct link to type")

```
type: string;
```

## Methods[​](#methods "Direct link to Methods")

### `isSupported()`[​](#issupported "Direct link to issupported")

Checks if this adapter is supported in the current environment/browser.

```
adapter.isSupported(): boolean;
```

### `create()`[​](#create "Direct link to create")

Creates a device for this adapter's backend.

```
create(props: DeviceProps): Promise<Device>;
```

### `attach()`[​](#attach "Direct link to attach")

Attaches a device to a GPU device handle from this backend.

```
attach?(handle: unknown): Promise<Device>;
```
