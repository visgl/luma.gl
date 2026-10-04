# Type Alias: MultisampleParameters

> **MultisampleParameters** = `object`

Defined in: [modules/core/src/adapter/types/parameters.ts:175](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L175)

Multisample

## Properties[​](#properties "Direct link to Properties")

### sampleAlphaToCoverageEnabled?[​](#samplealphatocoverageenabled "Direct link to sampleAlphaToCoverageEnabled?")

> `optional` **sampleAlphaToCoverageEnabled?**: `boolean`

Defined in: [modules/core/src/adapter/types/parameters.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L181)

When true indicates that a fragment’s alpha channel should be used to generate a sample coverage mask.

***

### sampleCount?[​](#samplecount "Direct link to sampleCount?")

> `optional` **sampleCount?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L177)

Number of samples per pixel. RenderPipeline will be compatible only with attachment textures with matching sampleCounts.

***

### sampleMask?[​](#samplemask "Direct link to sampleMask?")

> `optional` **sampleMask?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:179](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L179)

Mask determining which samples are written to. defaulting to 0xFFFFFFFF
