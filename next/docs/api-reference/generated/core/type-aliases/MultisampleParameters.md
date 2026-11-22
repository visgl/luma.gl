# Type Alias: MultisampleParameters

> **MultisampleParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:183](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L183)

Multisample

## Properties[​](#properties "Direct link to Properties")

### sampleAlphaToCoverageEnabled?[​](#samplealphatocoverageenabled "Direct link to sampleAlphaToCoverageEnabled?")

> `optional` **sampleAlphaToCoverageEnabled?**: `boolean`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:189](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L189)

When true indicates that a fragment’s alpha channel should be used to generate a sample coverage mask.

***

### sampleCount?[​](#samplecount "Direct link to sampleCount?")

> `optional` **sampleCount?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:185](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L185)

Number of samples per pixel. RenderPipeline will be compatible only with attachment textures with matching sampleCounts.

***

### sampleMask?[​](#samplemask "Direct link to sampleMask?")

> `optional` **sampleMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:187](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L187)

Mask determining which samples are written to. defaulting to 0xFFFFFFFF
