# Type Alias: NormalizedTypedArrayConstructorT\<T>

> **NormalizedTypedArrayConstructorT**<`T`> = `T` *extends* `"unorm8"` | `"snorm8"` | `"unorm16"` | `"snorm16"` ? `Float32ArrayConstructor` : [`TypedArrayConstructorT`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TypedArrayConstructorT.md)<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:142](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L142)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)
