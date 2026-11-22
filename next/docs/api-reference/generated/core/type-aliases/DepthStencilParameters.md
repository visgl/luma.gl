# Type Alias: DepthStencilParameters

> **DepthStencilParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L102)

## Properties[​](#properties "Direct link to Properties")

### clearDepth?[​](#cleardepth "Direct link to clearDepth?")

> `optional` **clearDepth?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:110](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L110)

Depth value used when clearing depth buffers.

***

### depthCompare?[​](#depthcompare "Direct link to depthCompare?")

> `optional` **depthCompare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L106)

The comparison operation used to test fragment depths against existing depthStencilAttachment depth values.

***

### depthFormat?[​](#depthformat "Direct link to depthFormat?")

> `optional` **depthFormat?**: [`TextureFormatDepthStencil`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L108)

The format of depthStencilAttachment this GPURenderPipeline will be compatible with.

***

### depthWriteEnabled?[​](#depthwriteenabled "Direct link to depthWriteEnabled?")

> `optional` **depthWriteEnabled?**: `boolean`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L104)

Whether this GPURenderPipeline can modify depthStencilAttachment depth values.

***

### stencilBack?[​](#stencilback "Direct link to stencilBack?")

> `optional` **stencilBack?**: [`StencilFaceState`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilFaceState.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L128)

Overrides individual stencil settings for back-facing primitives.

***

### stencilCompare?[​](#stencilcompare "Direct link to stencilCompare?")

> `optional` **stencilCompare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L118)

The CompareFunction used when testing fragments against depthStencilAttachment stencil values.

***

### stencilDepthFailOperation?[​](#stencildepthfailoperation "Direct link to stencilDepthFailOperation?")

> `optional` **stencilDepthFailOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L124)

The StencilOperation performed if the fragment stencil comparison test passes but the depth comparison described by depthCompare fails.

***

### stencilFailOperation?[​](#stencilfailoperation "Direct link to stencilFailOperation?")

> `optional` **stencilFailOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L122)

The StencilOperation performed if the fragment stencil comparison test described by stencilCompare fails.

***

### stencilFront?[​](#stencilfront "Direct link to stencilFront?")

> `optional` **stencilFront?**: [`StencilFaceState`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilFaceState.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L126)

Overrides individual stencil settings for front-facing primitives.

***

### stencilPassOperation?[​](#stencilpassoperation "Direct link to stencilPassOperation?")

> `optional` **stencilPassOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L120)

The StencilOperation performed if the fragment stencil comparison test described by stencilCompare and the depth comparison described by depthCompare both pass.

***

### stencilReadMask?[​](#stencilreadmask "Direct link to stencilReadMask?")

> `optional` **stencilReadMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L113)

Bitmask controlling which depthStencilAttachment stencil value bits are read when performing stencil comparison tests.

***

### stencilWriteMask?[​](#stencilwritemask "Direct link to stencilWriteMask?")

> `optional` **stencilWriteMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L115)

Bitmask controlling which depthStencilAttachment stencil value bits are written to when performing stencil operations.
