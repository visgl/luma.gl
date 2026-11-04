# Type Alias: DynamicBufferRange

> **DynamicBufferRange** = `object`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:20

Binding range that may point at either a Buffer or a [DynamicBuffer](https://luma.gl/docs/api-reference/generated/engine/classes/DynamicBuffer.md).

## Properties[​](#properties "Direct link to Properties")

### buffer[​](#buffer "Direct link to buffer")

> **buffer**: [`BufferBindingSource`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/BufferBindingSource.md)

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:22

Buffer source for the binding range.

***

### offset?[​](#offset "Direct link to offset?")

> `optional` **offset?**: `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:24

Byte offset into the current backing buffer.

***

### size?[​](#size "Direct link to size?")

> `optional` **size?**: `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:26

Byte length of the binding range.
