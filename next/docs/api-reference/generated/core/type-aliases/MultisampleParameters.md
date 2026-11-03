# Type Alias: MultisampleParameters

> **MultisampleParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L167)

Multisample

## Properties[​](#properties "Direct link to Properties")

### sampleAlphaToCoverageEnabled?[​](#samplealphatocoverageenabled "Direct link to sampleAlphaToCoverageEnabled?")

> `optional` **sampleAlphaToCoverageEnabled?**: `boolean`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L173)

When true indicates that a fragment’s alpha channel should be used to generate a sample coverage mask.

***

### sampleCount?[​](#samplecount "Direct link to sampleCount?")

> `optional` **sampleCount?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L169)

Number of samples per pixel. RenderPipeline will be compatible only with attachment textures with matching sampleCounts.

***

### sampleMask?[​](#samplemask "Direct link to sampleMask?")

> `optional` **sampleMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:171](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L171)

Mask determining which samples are written to. defaulting to 0xFFFFFFFF
