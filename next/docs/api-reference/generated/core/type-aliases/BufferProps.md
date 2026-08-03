# Type Alias: BufferProps

> **BufferProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/buffer.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/buffer.ts#L11)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### byteLength?[​](#bytelength "Direct link to byteLength?")

> `optional` **byteLength?**: `number`

Length in bytes of memory to be allocated. If not specified, `byteLength` of `props.data` will be used.

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Byte offset into the newly created Buffer to store data at

### data?[​](#data "Direct link to data?")

> `optional` **data?**: `ArrayBuffer` | `ArrayBufferView` | `null`

Data to initialize the buffer with.

### handle?[​](#handle "Direct link to handle?")

> `optional` **handle?**: `unknown`

Supply a handle to connect to an existing device-specific buffer

### indexType?[​](#indextype "Direct link to indexType?")

> `optional` **indexType?**: `"uint8"` | `"uint16"` | `"uint32"`

If props.usage includes Buffer.INDEX. Note: uint8 indices are automatically converted to uint16 for WebGPU compatibility

### onMapped?[​](#onmapped "Direct link to onMapped?")

> `optional` **onMapped?**: [`BufferMapCallback`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferMapCallback.md)<`void`>

Callback to initialize data without copy

### usage?[​](#usage "Direct link to usage?")

> `optional` **usage?**: `number`

Specifies how this buffer can be used
