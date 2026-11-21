# Type Alias: TextureProps

> **TextureProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:172](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L172)

Texture properties

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### ~~data?~~[​](#data "Direct link to data")

> `optional` **data?**: [`ExternalImage`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ExternalImage.md) | [`TypedArray`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `null`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use DynamicTexture to create textures with data.

### depth?[​](#depth "Direct link to depth?")

> `optional` **depth?**: `number`

Number of depth layers

### dimension?[​](#dimension "Direct link to dimension?")

> `optional` **dimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Dimension of this texture. Defaults to '2d'

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

The format (bit layout) of the textures pixel data

### height[​](#height "Direct link to height")

> **height**: `number`

Width in texels

### mipLevels?[​](#miplevels "Direct link to mipLevels?")

> `optional` **mipLevels?**: `number`

How many mip levels

### sampler?[​](#sampler "Direct link to sampler?")

> `optional` **sampler?**: [`Sampler`](https://luma.gl/docs/api-reference/generated/core/classes/Sampler.md) | [`SamplerProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/SamplerProps.md)

Sampler (or SamplerProps) for the default sampler for this texture. Used if no sampler provided. Note that other samplers can still be used.

### samples?[​](#samples "Direct link to samples?")

> `optional` **samples?**: `number`

Multi sampling

### usage?[​](#usage "Direct link to usage?")

> `optional` **usage?**: `number`

How this texture will be used. Defaults to TEXTURE | COPY\_DST | RENDER\_ATTACHMENT

### view?[​](#view "Direct link to view?")

> `optional` **view?**: [`TextureViewProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureViewProps.md)

Props for the default TextureView for this texture. Note that other views can still be created and used.

### width[​](#width "Direct link to width")

> **width**: `number`

Width in texels
