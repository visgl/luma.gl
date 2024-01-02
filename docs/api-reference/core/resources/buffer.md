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

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Buffer`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `BufferProps` - holds a copy of the `BufferProps` used to create this `Buffer`.

## Methods

### `constructor(props: BufferProps)`

`Buffer` is an abstract class and cannot be instantiated directly. Create with `device.createBuffer(...)`.

### `destroy(): void`

Free up any GPU resources associated with this buffer immediately (instead of waiting for garbage collection).
