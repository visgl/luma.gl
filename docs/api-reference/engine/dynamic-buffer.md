# DynamicBuffer

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
</p>

`DynamicBuffer` is the engine-level wrapper for applications that need a stable buffer object whose underlying GPU [`Buffer`](/docs/api-reference/core/resources/buffer) can grow or be replaced.
It is useful for streaming geometry, dynamic index data, uniform data, and any workflow where the required byte length is not known up front.

`Model` and `Material` accept `DynamicBuffer` bindings directly and resolve them to the current backing buffer during draw preparation.

![DynamicBuffer infographic showing a stable DynamicBuffer handle, replaceable backing Buffer, resize and write flow, and Model and Material integration](/images/docs/dynamic-buffer-infographic.png)

## Usage

```typescript
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

## Types

### `DynamicBufferProps`

```ts
export type DynamicBufferProps = Omit<BufferProps, 'handle' | 'onMapped'> & {
  debugData?: boolean | {maxByteLength?: number};
};
```

`DynamicBufferProps` mirrors normal `BufferProps` except that it owns buffer creation and does not accept an external handle or mapped callback.

### `DynamicBufferRange`

```ts
export type DynamicBufferRange = {
  buffer: Buffer | DynamicBuffer;
  offset?: number;
  size?: number;
};
```

Use a range when a shader binding should point at only part of the current backing buffer.

## Properties

### `device`, `id`

Owning device and application-provided identifier.

### `buffer: Buffer`

Current immutable core buffer. This object changes after a successful `resize()`.

### `byteLength: number`

Current backing buffer byte length.

### `ready: Promise<Buffer>`, `isReady: boolean`

Compatibility properties for engine code that handles dynamic resources. `DynamicBuffer` is ready synchronously after construction.

### `generation: number`

Increments whenever `resize()` replaces the backing buffer. Engine binding caches use this value to detect when they must rebind.

### `updateTimestamp: number`

Tracks writes, resize operations, and debug-data-producing readbacks.

### `debugData: ArrayBuffer`

Optional CPU-side mirror of recent writes and readbacks. Enable it with `debugData: true` or `debugData: {maxByteLength}`.

### `destroyed: boolean`

Indicates whether the dynamic buffer has been destroyed.

## Methods

### `constructor(device: Device, props: DynamicBufferProps)`

Creates the initial backing buffer.

### `write(data, byteOffset = 0): void`

Writes data into the current backing buffer.

### `mapAndWriteAsync(callback, byteOffset?, byteLength?): Promise<void>`

Maps a range for writing through the backing buffer API.

### `readAsync(byteOffset?, byteLength?): Promise<Uint8Array>`

Reads bytes from the backing buffer.

### `mapAndReadAsync(callback, byteOffset?, byteLength?): Promise<T>`

Maps a range for reading through the backing buffer API.

### `resize(options): boolean`

Replaces the backing buffer with `options.byteLength`.
Pass `preserveData: true` to copy bytes from the previous buffer into the new buffer.
Returns `false` when the byte length is unchanged.

### `ensureSize(byteLength, options?): boolean`

Grows the backing buffer only when `byteLength` is larger than the current size.

### `getBinding(range?): Binding`

Returns the current backing buffer, or a core buffer range binding when `offset` or `size` is supplied.

### `destroy(): void`

Destroys the current backing buffer and clears debug data.

## Remarks

- `DynamicBuffer` is directly supported by [`Model`](/docs/api-reference/engine/model) attributes, index buffers, and bindings.
- `DynamicBuffer` is directly supported by material-owned bindings created with `MaterialFactory`.
- Resizing replaces the underlying `Buffer`; keep the `DynamicBuffer` object as the long-lived application handle.
- Data preservation during resize requires copy support and is not available on `NullDevice`.
