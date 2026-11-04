# Type Alias: DynamicBufferProps

> **DynamicBufferProps** = `Omit`<`BufferProps`, `"handle"` | `"onMapped"`> & `object`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:9

Construction props for a [DynamicBuffer](https://luma.gl/docs/api-reference/generated/engine/classes/DynamicBuffer.md).

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### buffer?[​](#buffer "Direct link to buffer?")

> `optional` **buffer?**: `Buffer`

Existing immutable buffer to expose through this dynamic wrapper without copying.

### debugData?[​](#debugdata "Direct link to debugData?")

> `optional` **debugData?**: `DynamicBufferDebugProps`

Enables and optionally sizes the CPU-side debug mirror.

### ownsBuffer?[​](#ownsbuffer "Direct link to ownsBuffer?")

> `optional` **ownsBuffer?**: `boolean`

Whether this dynamic wrapper should destroy an adopted `buffer`. Defaults to `true`.
