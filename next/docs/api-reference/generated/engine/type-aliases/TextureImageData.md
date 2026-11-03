# Type Alias: TextureImageData

> **TextureImageData** = `object`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:8

One mip level Basic data structure is similar to `ImageData` additional optional fields can describe compressed texture data.

## Properties[​](#properties "Direct link to Properties")

### data[​](#data "Direct link to data")

> **data**: `TypedArray`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:14

Typed Array with the bytes of the image.

#### Note[​](#note "Direct link to Note")

beware row byte alignment requirements

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: `TextureFormat`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:12

WebGPU style format string. Defaults to 'rgba8unorm'

***

### height[​](#height "Direct link to height")

> **height**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:18

Height of the image, in rows

***

### textureFormat?[​](#textureformat "Direct link to textureFormat?")

> `optional` **textureFormat?**: `TextureFormat`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:10

Preferred WebGPU style format string.

***

### width[​](#width "Direct link to width")

> **width**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-data.d.ts:16

Width of the image, in pixels,

#### Note[​](#note-1 "Direct link to Note")

beware row byte alignment requirements
