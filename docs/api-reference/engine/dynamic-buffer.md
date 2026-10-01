# DynamicBuffer

[DynamicBuffer](https://luma.gl/docs/api-reference/engine/dynamic-buffer.md)[DynamicTexture](https://luma.gl/docs/api-reference/engine/dynamic-texture.md)[VideoTexture](https://luma.gl/docs/api-reference/engine/video-texture.md)[loadImageBitmap](https://luma.gl/docs/api-reference/engine/load-image-bitmap.md)

From v10

`DynamicBuffer` is the engine-level wrapper for applications that need a stable buffer object whose underlying GPU [`Buffer`](https://luma.gl/docs/api-reference/core/resources/buffer.md) can grow or be replaced. It is useful for streaming geometry, dynamic index data, uniform data, and any workflow where the required byte length is not known up front.

`Model` and `Material` accept `DynamicBuffer` bindings directly and resolve them to the current backing buffer during draw preparation.

![DynamicBuffer infographic showing a stable DynamicBuffer handle, replaceable backing Buffer, resize and write flow, and Model and Material integration](/assets/images/dynamic-buffer-infographic-20d7564b154510a7850a3e1067846e5d.png)

## Usage[​](#usage "Direct link to Usage")

```
import {Buffer} from '@luma.gl/core';

import {DynamicBuffer, Model} from '@luma.gl/engine';



const positions = new DynamicBuffer(device, {

  data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),

  usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC

});



const model = new Model(device, {

  vs,

  fs,

  attributes: {positions},

  bufferLayout: [{name: 'positions', format: 'float32x3'}]

});



positions.ensureSize(1024, {preserveData: true});

positions.write(new Float32Array([0, 0, 0]), 0);
```

## Types[​](#types "Direct link to Types")

### `DynamicBufferProps`[​](#dynamicbufferprops "Direct link to dynamicbufferprops")

```
export type DynamicBufferProps = Omit<BufferProps, 'handle' | 'onMapped'> & {

  debugData?: boolean | {maxByteLength?: number};

};
```

`DynamicBufferProps` mirrors normal `BufferProps` except that it owns buffer creation and does not accept an external handle or mapped callback.

### `DynamicBufferRange`[​](#dynamicbufferrange "Direct link to dynamicbufferrange")

```
export type DynamicBufferRange = {

  buffer: Buffer | DynamicBuffer;

  offset?: number;

  size?: number;

};
```

Use a range when a shader binding should point at only part of the current backing buffer.

## Properties[​](#properties "Direct link to Properties")

### `device`, `id`[​](#device-id "Direct link to device-id")

Owning device and application-provided identifier.

### `buffer: Buffer`[​](#buffer-buffer "Direct link to buffer-buffer")

Current immutable core buffer. This object changes after a successful `resize()`.

### `byteLength: number`[​](#bytelength-number "Direct link to bytelength-number")

Current backing buffer byte length.

### `ready: Promise<Buffer>`, `isReady: boolean`[​](#ready-promisebuffer-isready-boolean "Direct link to ready-promisebuffer-isready-boolean")

Compatibility properties for engine code that handles dynamic resources. `DynamicBuffer` is ready synchronously after construction.

### `generation: number`[​](#generation-number "Direct link to generation-number")

Increments whenever `resize()` replaces the backing buffer. Engine binding caches use this value to detect when they must rebind.

### `updateTimestamp: number`[​](#updatetimestamp-number "Direct link to updatetimestamp-number")

Tracks writes, resize operations, and debug-data-producing readbacks.

### `debugData: ArrayBuffer`[​](#debugdata-arraybuffer "Direct link to debugdata-arraybuffer")

Optional CPU-side mirror of recent writes and readbacks. Enable it with `debugData: true` or `debugData: {maxByteLength}`.

### `destroyed: boolean`[​](#destroyed-boolean "Direct link to destroyed-boolean")

Indicates whether the dynamic buffer has been destroyed.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: DynamicBufferProps)`[​](#constructordevice-device-props-dynamicbufferprops "Direct link to constructordevice-device-props-dynamicbufferprops")

Creates the initial backing buffer.

### `write(data, byteOffset = 0): void`[​](#writedata-byteoffset--0-void "Direct link to writedata-byteoffset--0-void")

Writes data into the current backing buffer.

### `mapAndWriteAsync(callback, byteOffset?, byteLength?): Promise<void>`[​](#mapandwriteasynccallback-byteoffset-bytelength-promisevoid "Direct link to mapandwriteasynccallback-byteoffset-bytelength-promisevoid")

Maps a range for writing through the backing buffer API.

### `readAsync(byteOffset?, byteLength?): Promise<Uint8Array>`[​](#readasyncbyteoffset-bytelength-promiseuint8array "Direct link to readasyncbyteoffset-bytelength-promiseuint8array")

Reads bytes from the backing buffer.

### `mapAndReadAsync(callback, byteOffset?, byteLength?): Promise<T>`[​](#mapandreadasynccallback-byteoffset-bytelength-promiset "Direct link to mapandreadasynccallback-byteoffset-bytelength-promiset")

Maps a range for reading through the backing buffer API.

### `resize(options): boolean`[​](#resizeoptions-boolean "Direct link to resizeoptions-boolean")

Replaces the backing buffer with `options.byteLength`. Pass `preserveData: true` to copy bytes from the previous buffer into the new buffer. Returns `false` when the byte length is unchanged.

### `ensureSize(byteLength, options?): boolean`[​](#ensuresizebytelength-options-boolean "Direct link to ensuresizebytelength-options-boolean")

Grows the backing buffer only when `byteLength` is larger than the current size.

### `getBinding(range?): Binding`[​](#getbindingrange-binding "Direct link to getbindingrange-binding")

Returns the current backing buffer, or a core buffer range binding when `offset` or `size` is supplied.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the current backing buffer and clears debug data.

## Remarks[​](#remarks "Direct link to Remarks")

* `DynamicBuffer` is directly supported by [`Model`](https://luma.gl/docs/api-reference/engine/model.md) attributes, index buffers, and bindings.
* `DynamicBuffer` is directly supported by material-owned bindings created with `MaterialFactory`.
* Resizing replaces the underlying `Buffer`; keep the `DynamicBuffer` object as the long-lived application handle.
* Data preservation during resize requires copy support and is not available on `NullDevice`.
