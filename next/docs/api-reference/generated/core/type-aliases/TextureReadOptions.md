# Type Alias: TextureReadOptions

> **TextureReadOptions** = `object`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L136)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L152)

When reading from depth stencil textures (default 'all')

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:148](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L148)

Number of array layers or depth slices to read. Defaults to 1.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L146)

Height of the region to read. Defaults to the mip height.

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:150](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L150)

Which mip-level to read from (default 0)

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L144)

Width of the region to read. Defaults to the mip width.

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L138)

Start reading from offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L140)

Start reading from offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/api/adapter/resources/texture.ts:142](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/texture.ts#L142)

Start reading from layer / depth slice z (default 0)
