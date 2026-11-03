# Type Alias: StorageColorsProps

> **StorageColorsProps** = `object`

Defined in: [modules/color/float-colors.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L55)

Props for reading packed color rows from a read-only storage buffer.

## Properties[​](#properties "Direct link to Properties")

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Defined in: [modules/color/float-colors.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L61)

Byte offset to the first color. Must be 4-byte aligned. Defaults to `0`.

***

### byteStride?[​](#bytestride "Direct link to byteStride?")

> `optional` **byteStride?**: `number`

Defined in: [modules/color/float-colors.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L63)

Bytes between color rows. Must be 4-byte aligned. Defaults to the packed format size.

***

### colorBuffer?[​](#colorbuffer "Direct link to colorBuffer?")

> `optional` **colorBuffer?**: `Binding`

Defined in: [modules/color/float-colors.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L57)

Storage buffer containing raw packed color words.

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`StorageColorFormat`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorFormat.md) | [`StorageColorFormatValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorFormatValue.md)

Defined in: [modules/color/float-colors.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L59)

Per-row storage color representation. Defaults to `rgba8unorm`.
