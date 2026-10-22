# Type Alias: CopyTextureToBufferOptions

> **CopyTextureToBufferOptions** = `object`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L52)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L61)

Defines which aspects of the texture to copy to/from.

***

### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

> `optional` **byteOffset?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L72)

Offset, in bytes, from the beginning of the buffer to the start of the image data (default 0)

***

### bytesPerRow?[​](#bytesperrow "Direct link to bytesPerRow?")

> `optional` **bytesPerRow?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L77)

The stride, in bytes, between the beginning of each block row and the subsequent block row. Required if there are multiple block rows (i.e. the copy height or depth is more than one block).

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L66)

***

### destinationBuffer[​](#destinationbuffer "Direct link to destinationBuffer")

> **destinationBuffer**: [`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L70)

Destination buffer

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L65)

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L56)

Mip-map level of the texture to copy to/from. (Default 0)

***

### origin?[​](#origin "Direct link to origin?")

> `optional` **origin?**: \[`number`, `number`, `number`]

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L67)

***

### rowsPerImage?[​](#rowsperimage "Direct link to rowsPerImage?")

> `optional` **rowsPerImage?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L83)

Number of block rows per single image of the texture. rowsPerImage × bytesPerRow is the stride, in bytes, between the beginning of each image of data and the subsequent image. Required if there are multiple images (i.e. the copy depth is more than one).

***

### sourceTexture[​](#sourcetexture "Direct link to sourceTexture")

> **sourceTexture**: [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L54)

Texture to copy to/from.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L64)

Width to copy
