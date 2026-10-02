# Type Alias: TextureWriteOptions

> **TextureWriteOptions** = `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L137)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/adapter/resources/texture.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L159)

When writing into depth stencil textures (default 'all')

***

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L139)

Offset into the source data or buffer, in bytes.

***

### bytesPerRow?[​](#bytesperrow "Direct link to bytesPerRow?")

> `optional` **bytesPerRow?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:141](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L141)

The stride, in bytes, between successive texel rows in the source data or buffer.

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L155)

Number of array layers or depth slices to write. Defaults to 1, or the full mip depth for 3D textures.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L153)

Height of the region to write. Defaults to the mip height.

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:157](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L157)

Which mip-level to write into (default 0)

***

### rowsPerImage?[​](#rowsperimage "Direct link to rowsPerImage?")

> `optional` **rowsPerImage?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L143)

The number of rows that make up one image when writing multiple layers or slices.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L151)

Width of the region to write. Defaults to the mip width.

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L145)

Start writing into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L147)

Start writing into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:149](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L149)

Start writing into layer / depth slice z (default 0)
