# Type Alias: VertexFormatDataTypeT\<T>

> **VertexFormatDataTypeT**<`T`> = `T` *extends* `VertexFormatUint8` ? `"uint8"` : `T` *extends* `VertexFormatSint8` ? `"sint8"` : `T` *extends* `VertexFormatUnorm8` ? `"unorm8"` : `T` *extends* `VertexFormatSnorm8` ? `"snorm8"` : `T` *extends* `VertexFormatUint16` ? `"uint16"` : `T` *extends* `VertexFormatSint16` ? `"sint16"` : `T` *extends* `VertexFormatUnorm16` ? `"unorm16"` : `T` *extends* `VertexFormatSnorm16` ? `"snorm16"` : `T` *extends* `VertexFormatUint32` ? `"uint32"` : `T` *extends* `VertexFormatSint32` ? `"sint32"` : ... *extends* ... ? ... : ...

Defined in: [modules/core/src/shadertypes/vertex-types/vertex-formats.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/vertex-types/vertex-formats.ts#L105)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`VertexFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexFormat.md)
