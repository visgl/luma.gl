# Type Alias: StorageColorsUniforms

> **StorageColorsUniforms** = `object`

Defined in: [modules/color/float-colors.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L67)

Uniforms consumed by the packed storage color reader.

## Properties[​](#properties "Direct link to Properties")

### \_padding[​](#_padding "Direct link to _padding")

> **\_padding**: `number`

Defined in: [modules/color/float-colors.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L75)

Reserved field retaining a 16-byte uniform block.

***

### format[​](#format "Direct link to format")

> **format**: [`StorageColorFormatValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorFormatValue.md)

Defined in: [modules/color/float-colors.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L69)

Numeric `STORAGE_COLOR_FORMAT` tag used by WGSL.

***

### wordOffset[​](#wordoffset "Direct link to wordOffset")

> **wordOffset**: `number`

Defined in: [modules/color/float-colors.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L73)

Uint32 word offset to the first storage color row.

***

### wordStride[​](#wordstride "Direct link to wordStride")

> **wordStride**: `number`

Defined in: [modules/color/float-colors.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L71)

Uint32 words between storage color rows.
