# Type Alias: TextureWriteOptions

> **TextureWriteOptions** = `object`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L155)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L177)

When writing into depth stencil textures (default 'all')

***

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:157](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L157)

Offset into the source data or buffer, in bytes.

***

### bytesPerRow?[​](#bytesperrow "Direct link to bytesPerRow?")

> `optional` **bytesPerRow?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L159)

The stride, in bytes, between successive texel rows in the source data or buffer.

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L173)

Number of array layers or depth slices to write. Defaults to 1, or the full mip depth for 3D textures.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:171](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L171)

Height of the region to write. Defaults to the mip height.

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:175](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L175)

Which mip-level to write into (default 0)

***

### rowsPerImage?[​](#rowsperimage "Direct link to rowsPerImage?")

> `optional` **rowsPerImage?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:161](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L161)

The number of rows that make up one image when writing multiple layers or slices.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L169)

Width of the region to write. Defaults to the mip width.

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:163](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L163)

Start writing into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L165)

Start writing into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L167)

Start writing into layer / depth slice z (default 0)
