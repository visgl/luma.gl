# Type Alias: BufferAttributeLayout

> **BufferAttributeLayout** = `object`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L58)

Specifies how the GPU should read one specific attribute from a buffer.

## Properties[​](#properties "Direct link to Properties")

### attribute[​](#attribute "Direct link to attribute")

> **attribute**: `string`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L60)

Name of attribute that maps to a "view" of this buffer

***

### byteOffset[​](#byteoffset "Direct link to byteOffset")

> **byteOffset**: `number`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L64)

Sum up any the "global" offset (or 0) and the offset each stride (for interleaved data).

***

### format[​](#format "Direct link to format")

> **format**: [`VertexFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L62)

Data format of the memory in the buffer that is mapped to this attribute
