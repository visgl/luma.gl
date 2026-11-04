# Type Alias: TextureTransformProps

> **TextureTransformProps** = `Omit`<[`GPUVectorModelProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md), `"fs"`> & `object`

Defined in: [modules/engine/src/compute/texture-transform.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L17)

Properties for creating a [TextureTransform](https://luma.gl/docs/api-reference/generated/engine/classes/TextureTransform.md)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### ~~framebuffer?~~[​](#framebuffer "Direct link to framebuffer")

> `optional` **framebuffer?**: `Framebuffer`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

TODO(donmccurdy): Needed?

### fs?[​](#fs "Direct link to fs?")

> `optional` **fs?**: [`GPUVectorModelProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)\[`"fs"`]

### ~~inject?~~[​](#inject "Direct link to inject")

> `optional` **inject?**: `Record`<`string`, `string`>

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

TODO(donmccurdy): Needed?

### inputVectors?[​](#inputvectors "Direct link to inputVectors?")

> `optional` **inputVectors?**: [`GPUVectorModelInputs`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

Borrowed contiguous vectors mapped to vertex-buffer layout names.

### ~~sourceBuffers?~~[​](#sourcebuffers "Direct link to sourcebuffers")

> `optional` **sourceBuffers?**: `Record`<`string`, `Buffer`>

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

TODO(donmccurdy): GPUVectorModel already handles this?

### ~~sourceTextures?~~[​](#sourcetextures "Direct link to sourcetextures")

> `optional` **sourceTextures?**: `Record`<`string`, `Texture`>

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

TODO(donmccurdy): GPUVectorModel already handles this?

### targetTexture[​](#targettexture "Direct link to targetTexture")

> **targetTexture**: `Texture`

### targetTextureChannels[​](#targettexturechannels "Direct link to targetTextureChannels")

> **targetTextureChannels**: `1` | `2` | `3` | `4`

### targetTextureVarying[​](#targettexturevarying "Direct link to targetTextureVarying")

> **targetTextureVarying**: `string`
