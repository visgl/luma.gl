# Type Alias: NormalizedDataType

> **NormalizedDataType** = [`SignedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/SignedDataType.md) | `"unorm8"` | `"snorm8"` | `"unorm16"` | `"snorm16"`

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L34)

Normalized data types describe signed and unsigned integers as well as floats of varying sizes together with normalization behavior

## Note[​](#note "Direct link to Note")

These formats describe physical memory layouts in vertex and pixel formats, they are not used inside shaders

## Note[​](#note-1 "Direct link to Note")

Normalization means that these formats are converted into floats on read (shader must use f32 to process them)

## Note[​](#note-2 "Direct link to Note")

WebGPU does not support normalized 32 bit integer attributes: 'unorm32' | 'snorm32'
