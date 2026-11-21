# Type Alias: CopyExternalImageOptions

> **CopyExternalImageOptions** = `object`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L31)

Options for Texture.copyExternalImage

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L53)

When copying into depth stencil textures (default 'all')

***

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L55)

Specific color space of image data

***

### depth?[​](#depth "Direct link to depth?")

> `optional` **depth?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L43)

Copy depth, number of layers/depth slices(default 1)

***

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L67)

Whether to flip the image vertically (default false). On WebGL, this option does not apply to ImageBitmap sources. Supply `imageOrientation: 'flipY'` or `'from-image'` when calling `createImageBitmap()` instead.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L41)

Copy area height (default 1)

***

### image[​](#image "Direct link to image")

> **image**: [`ExternalImage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ExternalImage.md)

Defined in: [modules/core/src/api/adapter/resources/texture.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L33)

Image

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L51)

Which mip-level to copy into (default 0)

***

### premultipliedAlpha?[​](#premultipliedalpha "Direct link to premultipliedAlpha?")

> `optional` **premultipliedAlpha?**: `boolean`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L61)

Whether to premultiply alpha (default false). On WebGL, this option does not apply to ImageBitmap sources. Supply `premultiplyAlpha: 'premultiply'` or `'none'` when calling `createImageBitmap()` instead.

***

### sourceX?[​](#sourcex "Direct link to sourceX?")

> `optional` **sourceX?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L35)

Copy from image x offset (default 0)

***

### sourceY?[​](#sourcey "Direct link to sourceY?")

> `optional` **sourceY?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L37)

Copy from image y offset (default 0)

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L39)

Copy area width (default 1)

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L45)

Start copying into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L47)

Start copying into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L49)

Start copying into layer / depth slice z (default 0)
