# Adapter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.1-blue.svg?style=flat-square" alt="From-v9.1" />
</p>

An `Adapter` is a factory that creates [`Device`](./device) instances for a specific backend (e.g. WebGPU or WebGL).
Each GPU backend exports a singleton adapter instance that is used to create devices for that GPU backend.

Adapters can be used directly to create and attach devices, but they are usually imported and used via the [`luma`](./luma) API through 
methods like [`luma.createDevice`].

Note: an adapter may perform asynchronous loading of adapter code, debug libraries, etc before creating the `Device`.

## Usage 

Register the WebGL backend, then create a WebGL2 context, auto creating a canvas

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
luma.registerAdapters([webgl2Adapter]);
const webglDevice = await luma.createDevice({type: 'webgl', createCanvasContext: ...});
```

## Members

### `type`

```ts
type: string;
```

## Methods

### `isSupported()`

Checks if this adapter is supported in the current environment/browser.

```ts
adapter.isSupported(): boolean;
```

### `create()`

Creates a device for this adapter's backend.

```ts
create(props: DeviceProps): Promise<Device>;
```

### `attach()`

Attaches a device to a GPU device handle from this backend.

```ts
attach?(handle: unknown): Promise<Device>;
```
