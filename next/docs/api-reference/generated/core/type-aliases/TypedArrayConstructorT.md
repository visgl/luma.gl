# Type Alias: TypedArrayConstructorT\<T>

> **TypedArrayConstructorT**<`T`> = `T` *extends* `"uint8"` ? `Uint8ArrayConstructor` : `T` *extends* `"sint8"` ? `Int8ArrayConstructor` : `T` *extends* `"unorm8"` ? `Uint8ArrayConstructor` : `T` *extends* `"snorm8"` ? `Int8ArrayConstructor` : `T` *extends* `"uint16"` ? `Uint16ArrayConstructor` : `T` *extends* `"sint16"` ? `Int16ArrayConstructor` : `T` *extends* `"unorm16"` ? `Uint16ArrayConstructor` : `T` *extends* `"snorm16"` ? `Int16ArrayConstructor` : `T` *extends* `"uint32"` ? `Uint32ArrayConstructor` : `T` *extends* `"sint32"` ? `Int32ArrayConstructor` : ... *extends* ... ? ... : ...

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L115)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)
