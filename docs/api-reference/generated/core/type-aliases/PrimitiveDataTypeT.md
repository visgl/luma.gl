# Type Alias: PrimitiveDataTypeT\<T>

> **PrimitiveDataTypeT**<`T`> = `T` *extends* `"float32"` ? `"f32"` : `T` *extends* `"float16"` ? `"f16"` : `T` *extends* `"unorm8"` | `"snorm8"` | `"unorm16"` | `"snorm16"` ? `"f32"` : `T` *extends* `"uint8"` | `"uint16"` | `"uint32"` ? `"u32"` : `T` *extends* `"sint8"` | `"sint16"` | `"sint32"` ? `"i32"` : `never`

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L53)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)
