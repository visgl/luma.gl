# Type Alias: TextureFormatInfo

> **TextureFormatInfo** = `object`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L12)

Information about the structure of a texture format

## Properties[​](#properties "Direct link to Properties")

### attachment?[​](#attachment "Direct link to attachment?")

> `optional` **attachment?**: `"color"` | `"depth"` | `"stencil"` | `"depth-stencil"`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L16)

Color or depth stencil attachment formats

***

### bitsPerChannel[​](#bitsperchannel "Direct link to bitsPerChannel")

> **bitsPerChannel**: \[`number`, `number`, `number`, `number`]

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L28)

Number of bits per channel (may be unreliable for packed formats)

***

### blockHeight?[​](#blockheight "Direct link to blockHeight?")

> `optional` **blockHeight?**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L46)

Compressed formats only: Block size for ASTC formats (texture height must be a multiple of this value)

***

### blockWidth?[​](#blockwidth "Direct link to blockWidth?")

> `optional` **blockWidth?**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L44)

Compressed formats only: Block size for ASTC formats (texture width must be a multiple of this value)

***

### bytesPerBlock?[​](#bytesperblock "Direct link to bytesPerBlock?")

> `optional` **bytesPerBlock?**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L26)

Compressed formats only: Number of bytes per block

***

### bytesPerPixel[​](#bytesperpixel "Direct link to bytesPerPixel")

> **bytesPerPixel**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L24)

Number of bytes per pixel

***

### channels[​](#channels "Direct link to channels")

> **channels**: `"r"` | `"rg"` | `"rgb"` | `"rgba"` | `"bgra"`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L18)

String describing which channels this texture has

***

### components[​](#components "Direct link to components")

> **components**: `1` | `2` | `3` | `4`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L20)

Number of components (corresponds to channels string)

***

### compressed?[​](#compressed "Direct link to compressed?")

> `optional` **compressed?**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L42)

Is this a compressed texture format

***

### dataType?[​](#datatype "Direct link to dataType?")

> `optional` **dataType?**: [`NormalizedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L22)

What is the data type of each component

***

### format[​](#format "Direct link to format")

> **format**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L14)

The format that is described

***

### integer[​](#integer "Direct link to integer")

> **integer**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L36)

Is this an integer or floating point format?

***

### normalized[​](#normalized "Direct link to normalized")

> **normalized**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L40)

Is this a normalized integer format?

***

### packed?[​](#packed "Direct link to packed?")

> `optional` **packed?**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L30)

If this is a packed data type

***

### signed[​](#signed "Direct link to signed")

> **signed**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L38)

Is this a signed or unsigned format?

***

### srgb?[​](#srgb "Direct link to srgb?")

> `optional` **srgb?**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L32)

SRGB texture format?

***

### webgl?[​](#webgl "Direct link to webgl?")

> `optional` **webgl?**: `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L34)

WebGL specific texture format?
