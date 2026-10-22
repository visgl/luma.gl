# Type Alias: CopyTextureToTextureOptions

> **CopyTextureToTextureOptions** = `object`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L86)

## Properties[​](#properties "Direct link to Properties")

### aspect?[​](#aspect "Direct link to aspect?")

> `optional` **aspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L94)

Defines which aspects of the GPUImageCopyTexture#texture to copy to/from.

***

### depthOrArrayLayers?[​](#depthorarraylayers "Direct link to depthOrArrayLayers?")

> `optional` **depthOrArrayLayers?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L108)

***

### destinationAspect?[​](#destinationaspect "Direct link to destinationAspect?")

> `optional` **destinationAspect?**: `"all"` | `"stencil-only"` | `"depth-only"`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L103)

Defines which aspects of the GPUImageCopyTexture#texture to copy to/from.

***

### destinationMipLevel?[​](#destinationmiplevel "Direct link to destinationMipLevel?")

> `optional` **destinationMipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L99)

Mip-map level of the texture to copy to/from. (Default 0)

***

### destinationOrigin?[​](#destinationorigin "Direct link to destinationOrigin?")

> `optional` **destinationOrigin?**: \[`number`, `number`, `number`]

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L101)

Defines the origin of the copy - the minimum corner of the texture sub-region to copy to.

***

### destinationTexture[​](#destinationtexture "Direct link to destinationTexture")

> **destinationTexture**: [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L97)

Texture to copy to/from.

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L107)

***

### mipLevel?[​](#miplevel "Direct link to mipLevel?")

> `optional` **mipLevel?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L90)

Mip-map level of the texture to copy to/from. (Default 0)

***

### origin?[​](#origin "Direct link to origin?")

> `optional` **origin?**: \[`number`, `number`, `number`]

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L92)

Defines the origin of the copy - the minimum corner of the texture sub-region to copy from.

***

### sourceTexture[​](#sourcetexture "Direct link to sourceTexture")

> **sourceTexture**: [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L88)

Texture to copy to/from.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L106)

Width to copy
