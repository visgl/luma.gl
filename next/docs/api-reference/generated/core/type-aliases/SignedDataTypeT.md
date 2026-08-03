# Type Alias: SignedDataTypeT\<T>

> **SignedDataTypeT**<`T`> = `T` *extends* `"unorm8"` ? `"uint8"` : `T` *extends* `"snorm8"` ? `"sint8"` : `T` *extends* `"unorm16"` ? `"uint16"` : `T` *extends* `"snorm16"` ? `"sint16"` : `T` *extends* [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md) ? `T` : `never`

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L66)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)
