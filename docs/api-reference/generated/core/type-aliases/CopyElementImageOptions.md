# Type Alias: CopyElementImageOptions

> **CopyElementImageOptions** = `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L53)

Options for Texture.copyElementImage

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/adapter/resources/texture.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L79)

When copying into depth stencil textures (default 'all')

***

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"`

Defined in: [modules/core/src/adapter/resources/texture.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L81)

Specific color space of image data

***

### depth?[​](#depth "Direct link to depth?")

> `optional` **depth?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L69)

Copy depth, number of layers/depth slices(default 1)

***

### element[​](#element "Direct link to element")

> **element**: `Element`

Defined in: [modules/core/src/adapter/resources/texture.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L55)

DOM element rendered by the browser into the texture.

***

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

Defined in: [modules/core/src/adapter/resources/texture.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L85)

Whether to flip the image vertically

***

### height[​](#height "Direct link to height")

> **height**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L59)

Copy area height in pixels.

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L77)

Which mip-level to copy into (default 0)

***

### premultipliedAlpha?[​](#premultipliedalpha "Direct link to premultipliedAlpha?")

> `optional` **premultipliedAlpha?**: `boolean`

Defined in: [modules/core/src/adapter/resources/texture.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L83)

load as premultiplied alpha

***

### sourceHeight?[​](#sourceheight "Direct link to sourceHeight?")

> `optional` **sourceHeight?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L67)

Copy area height in source CSS pixels. Defaults to destination height.

***

### sourceWidth?[​](#sourcewidth "Direct link to sourceWidth?")

> `optional` **sourceWidth?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L65)

Copy area width in source CSS pixels. Defaults to destination width.

***

### sourceX?[​](#sourcex "Direct link to sourceX?")

> `optional` **sourceX?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L61)

Start copying from source offset x (default 0)

***

### sourceY?[​](#sourcey "Direct link to sourceY?")

> `optional` **sourceY?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L63)

Start copying from source offset y (default 0)

***

### width[​](#width "Direct link to width")

> **width**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L57)

Copy area width in pixels.

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L71)

Start copying into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L73)

Start copying into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L75)

Start copying into layer / depth slice z (default 0)
