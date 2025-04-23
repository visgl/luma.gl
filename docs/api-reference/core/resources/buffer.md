# Buffer

Holds a block of GPU memory. The length of a buffer cannot be changed after creation.

## Types

### `BufferProps`

| Property      | Type                             | Description                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `usage?`      | `number`                         | Bit mask of Usage flags                                                      |
| `byteLength?` | `number`                         | Length of buffer (cannot be changed after creation).                         |
| `data?`       | `ArrayBuffer \| ArrayBufferView` | Data to be copied into buffer. `byteLength` will be deduced if not supplied. |
| `byteOffset?` | `number`                         | Offset for `data`                                                            |
| `indexType?`  | `'uint16' \| 'uint32'`           | If props.usage & Buffer.INDEX                                                |

### Usage

Usage expresses two things: The type of buffer and what operations can be performed on it.

Note that the allowed combinations are very limited, especially in WebGPU.

| Usage Flag             | Value  | Description                                              |
| ---------------------- | ------ | -------------------------------------------------------- |
| `Buffer.INDEX`         | 0x0010 | An index buffer (array of 16 or 32 bit unsigned integers |
| `Buffer.VERTEX`        | 0x0020 | A vertex buffer (a binary column)                        |
| `Buffer.UNIFORM`       | 0x0040 | A uniform buffer                                         |
| `Buffer.STORAGE`       | 0x0080 | A storage buffer                                         |
| `Buffer.INDIRECT`      | 0x0100 |
| `Buffer.QUERY_RESOLVE` | 0x0200 |
| `Buffer.MAP_READ`      | 0x01   | Whether the buffer can be mapped for read                |
| `Buffer.MAP_WRITE`     | 0x02   | Whether the buffer can be mapped for write               |
| `Buffer.COPY_SRC`      | 0x0004 | Supports `commandEncoder.copyBufferTo...` |
| `Buffer.COPY_DST`      | 0x0008 | Supports `commandEncoder.copy...ToBuffer` |

### `BufferMapCallback`

Called when a GPU buffer data has been mapped to the CPU.

```ts
type BufferMapCallback<T> = (arrayBuffer: ArrayBuffer, lifetime: 'mapped' | 'copied') => T;
```
- `arrayBuffer` an array buffer containing the data range of the buffer.
- `lifetime` - indicates whether the `arrayBuffer` parameter is only available in the callback (WebGPU) or whether it is permanent and can be used after the callback returns (WebGL2).

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Buffer`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `BufferProps` - holds a copy of the `BufferProps` used to create this `Buffer`.

## Methods

### `constructor(props: BufferProps)`

`Buffer` is an abstract class and cannot be instantiated directly. Create with `device.createBuffer(...)`.

### `destroy(): void`

Free up any GPU resources associated with this buffer immediately (instead of waiting for garbage collection).

### `write(): void`

```ts
buffer.write(data: ArrayBufferLike | ArrayBufferView, byteOffset?: number): void;
```

Writes data to the GPU buffer. 

- `data` - binary data to be written to the GPU Buffer.
- `byteOffset` - the first byte to read from the GPU buffer.
- `byteLength` - the number of bytes to read from the GPU buffer

Remarks
- Data writes are asynchronous on the GPU but will be completed before any reads.

### `readAsync(): Promise<ArrayBuffer>`

Reads the contents of a GPU Buffer into CPU memory.

```ts
buffer.readAsync(byteOffset?: number, byteLength?: number): Promise<Uint8Array>;
```

Remarks:
- On WebGPU, this copies the mapped buffer data into a permanent array buffer. If you do not need a copy of the memory, considering using `mapAndReadAsync` instead.

### `mapAndReadAsync(): Promise<void>`

Maps buffer data to CPU memory. Mapped memory is only accessible in the callback.

```ts
  buffer.mapAndReadAsync<T>(onData: BufferMapCallback<T>, byteOffset?: number, byteLength?: number): Promise<T>;
```

- `onData` - called when the GPU buffer data has been mapped onto the CPU.
- `byteOffset` - the first byte to read from the GPU buffer.
- `byteLength` - the number of bytes to read from the GPU buffer

Note:
- On WebGPU, if you do not plan to hold on to the ArrayBuffer read from the buffer, you can provide a callback that accesses the mapped buffer data before it is unmapped.

### `readSyncWebGL(): ArrayBuffer`

- `byteOffset` - the first byte to read from the GPU buffer.
- `byteLength` - the number of bytes to read from the GPU buffer

Synchronous reads, while convenient, have significant performance penalty as they force a GPU sync.
Synchronous reads are not available on WebGPU.
