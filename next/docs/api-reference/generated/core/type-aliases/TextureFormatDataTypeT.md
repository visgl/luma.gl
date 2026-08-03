# Type Alias: TextureFormatDataTypeT\<T>

> **TextureFormatDataTypeT**<`T`> = `T` *extends* `TextureFormatUint8` ? `"uint8"` : `T` *extends* `TextureFormatSint8` ? `"sint8"` : `T` *extends* `TextureFormatUnorm8` ? `"unorm8"` : `T` *extends* `TextureFormatSnorm8` ? `"snorm8"` : `T` *extends* `TextureFormatUint16` ? `"uint16"` : `T` *extends* `TextureFormatSint16` ? `"sint16"` : `T` *extends* `TextureFormatUnorm16` ? `"unorm16"` : `T` *extends* `TextureFormatSnorm16` ? `"snorm16"` : `T` *extends* `TextureFormatUint32` ? `"uint32"` : `T` *extends* `TextureFormatSint32` ? `"sint32"` : ... *extends* ... ? ... : ...

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-generics.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-generics.ts#L12)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)
