# Type Alias: TextureReadOptions

> **TextureReadOptions** = `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L118)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/adapter/resources/texture.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L134)

When reading from depth stencil textures (default 'all')

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L130)

Number of array layers or depth slices to read. Defaults to 1.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L128)

Height of the region to read. Defaults to the mip height.

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L132)

Which mip-level to read from (default 0)

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L126)

Width of the region to read. Defaults to the mip width.

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L120)

Start reading from offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L122)

Start reading from offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L124)

Start reading from layer / depth slice z (default 0)
