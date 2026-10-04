# Type Alias: VertexFormat

> **VertexFormat** = `"uint8"` | `"uint8x2"` | `"uint8x3-webgl"` | `"uint8x4"` | `"sint8"` | `"sint8x2"` | `"sint8x3-webgl"` | `"sint8x4"` | `"unorm8"` | `"unorm8x2"` | `"unorm8x3-webgl"` | `"unorm8x4"` | `"unorm8x4-bgra"` | `"unorm10-10-10-2"` | `"snorm8"` | `"snorm8x2"` | `"snorm8x3-webgl"` | `"snorm8x4"` | `"uint16"` | `"sint16"` | `"unorm16"` | `"snorm16"` | `"uint16x2"` | `"uint16x3-webgl"` | `"uint16x4"` | `"sint16x2"` | `"sint16x3-webgl"` | `"sint16x4"` | `"unorm16x2"` | `"unorm16x3-webgl"` | `"unorm16x4"` | `"snorm16x2"` | `"snorm16x3-webgl"` | `"snorm16x4"` | `"uint32"` | `"uint32x2"` | `"uint32x3"` | `"uint32x4"` | `"sint32"` | `"sint32x2"` | `"sint32x3"` | `"sint32x4"` | `"float16"` | `"float16x2"` | `"float16x4"` | `"float32"` | `"float32x2"` | `"float32x3"` | `"float32x4"`

Defined in: [modules/core/src/shadertypes/vertex-types/vertex-formats.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/vertex-types/vertex-formats.ts#L17)

Describes the **memory format** and interpretation (normalization) of a buffer that will be supplied to vertex attributes

## Note[​](#note "Direct link to Note")

Must be compatible with the AttributeShaderType of the shaders, see documentation.

## Note[​](#note-1 "Direct link to Note")

This is a superset of WebGPU vertex formats to allow for some flexibility for WebGL only applications

## Todo[​](#todo "Direct link to Todo")

Add device.isVertexFormatSupported() method?
