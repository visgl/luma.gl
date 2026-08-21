# Type Alias: CopyImageDataOptions

> **CopyImageDataOptions** = `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L89)

Options for copyImageData

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/adapter/resources/texture.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L115)

When copying into depth stencil textures (default 'all')

***

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L93)

Offset into the data (in addition to any offset built-in to the ArrayBufferView)

***

### bytesPerRow?[​](#bytesperrow "Direct link to bytesPerRow?")

> `optional` **bytesPerRow?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L95)

The stride, in bytes, between successive texel rows in the CPU source data. Tightly packed uploads can omit this.

***

### data[​](#data "Direct link to data")

> **data**: `ArrayBuffer` | `SharedArrayBuffer` | `ArrayBufferView`

Defined in: [modules/core/src/adapter/resources/texture.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L91)

Data to copy (array of bytes)

***

### ~~depth?~~[​](#depth "Direct link to depth")

> `optional` **depth?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L105)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use `depthOrArrayLayers`

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L103)

Copy depth or number of layers

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L101)

Height to copy

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L113)

Which mip-level to copy into (default 0)

***

### rowsPerImage?[​](#rowsperimage "Direct link to rowsPerImage?")

> `optional` **rowsPerImage?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L97)

Number of rows that make up one image when uploading multiple layers or depth slices from CPU memory.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L99)

Width to copy

***

### x?[​](#x "Direct link to x?")

> `optional` **x?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L107)

Start copying into offset x (default 0)

***

### y?[​](#y "Direct link to y?")

> `optional` **y?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L109)

Start copying into offset y (default 0)

***

### z?[​](#z "Direct link to z?")

> `optional` **z?**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L111)

Start copying from depth layer z (default 0)
