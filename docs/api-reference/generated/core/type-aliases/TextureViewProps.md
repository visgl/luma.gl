# Type Alias: TextureViewProps

> **TextureViewProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/texture-view.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture-view.ts#L11)

Properties for initializing a texture view

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### arrayLayerCount[​](#arraylayercount "Direct link to arrayLayerCount")

> **arrayLayerCount**: `number`

How many array layers, starting with baseArrayLayer, are accessible to the texture view.

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Which aspect(s) of the texture are accessible to the texture view. default "all"

### baseArrayLayer?[​](#basearraylayer "Direct link to baseArrayLayer?")

> `optional` **baseArrayLayer?**: `number`

The index of the first array layer accessible to the texture view. default 0

### baseMipLevel?[​](#basemiplevel "Direct link to baseMipLevel?")

> `optional` **baseMipLevel?**: `number`

The first (most detailed) mipmap level accessible to the texture view. default 0

### dimension?[​](#dimension "Direct link to dimension?")

> `optional` **dimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

The dimension to view the texture as.

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

The format of the texture view. Must be either the format of the texture or one of the viewFormats specified during its creation.

### mipLevelCount[​](#miplevelcount "Direct link to mipLevelCount")

> **mipLevelCount**: `number`

How many mipmap levels, starting with baseMipLevel, are accessible to the texture view.
