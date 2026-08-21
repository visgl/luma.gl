# Type Alias: CopyExternalImageOptions

> **CopyExternalImageOptions** = `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L21)

Options for Texture.copyExternalImage

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/adapter/resources/texture.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L43)

When copying into depth stencil textures (default 'all')

***

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"`

Defined in: [modules/core/src/adapter/resources/texture.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L45)

Specific color space of image data

***

### depth?[​](#depth "Direct link to depth?")

> `optional` **depth?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L33)

Copy depth, number of layers/depth slices(default 1)

***

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

Defined in: [modules/core/src/adapter/resources/texture.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L49)

Whether to flip the image vertically

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L31)

Copy area height (default 1)

***

### image[​](#image "Direct link to image")

> **image**: [`ExternalImage`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ExternalImage.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L23)

Image

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L41)

Which mip-level to copy into (default 0)

***

### premultipliedAlpha?[​](#premultipliedalpha "Direct link to premultipliedAlpha?")

> `optional` **premultipliedAlpha?**: `boolean`

Defined in: [modules/core/src/adapter/resources/texture.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L47)

load as premultiplied alpha

***

### sourceX?[​](#sourcex "Direct link to sourceX?")

> `optional` **sourceX?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L25)

Copy from image x offset (default 0)

***

### sourceY?[​](#sourcey "Direct link to sourceY?")

> `optional` **sourceY?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L27)

Copy from image y offset (default 0)

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L29)

Copy area width (default 1)

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L35)

Start copying into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L37)

Start copying into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L39)

Start copying into layer / depth slice z (default 0)
