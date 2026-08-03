# Type Alias: DepthStencilParameters

> **DepthStencilParameters** = `object`

Defined in: [modules/core/src/adapter/types/parameters.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L98)

## Properties[​](#properties "Direct link to Properties")

### clearDepth?[​](#cleardepth "Direct link to clearDepth?")

> `optional` **clearDepth?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L106)

Depth value used when clearing depth buffers.

***

### depthCompare?[​](#depthcompare "Direct link to depthCompare?")

> `optional` **depthCompare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L102)

The comparison operation used to test fragment depths against existing depthStencilAttachment depth values.

***

### depthFormat?[​](#depthformat "Direct link to depthFormat?")

> `optional` **depthFormat?**: [`TextureFormatDepthStencil`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L104)

The format of depthStencilAttachment this GPURenderPipeline will be compatible with.

***

### depthWriteEnabled?[​](#depthwriteenabled "Direct link to depthWriteEnabled?")

> `optional` **depthWriteEnabled?**: `boolean`

Defined in: [modules/core/src/adapter/types/parameters.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L100)

Whether this GPURenderPipeline can modify depthStencilAttachment depth values.

***

### stencilCompare?[​](#stencilcompare "Direct link to stencilCompare?")

> `optional` **stencilCompare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L114)

The CompareFunction used when testing fragments against depthStencilAttachment stencil values.

***

### stencilDepthFailOperation?[​](#stencildepthfailoperation "Direct link to stencilDepthFailOperation?")

> `optional` **stencilDepthFailOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L120)

The GPUStencilOperation performed if the fragment stencil comparison test described by compare passes.

***

### stencilFailOperation?[​](#stencilfailoperation "Direct link to stencilFailOperation?")

> `optional` **stencilFailOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L118)

The GPUStencilOperation performed if the fragment depth comparison described by depthCompare fails.

***

### stencilPassOperation?[​](#stencilpassoperation "Direct link to stencilPassOperation?")

> `optional` **stencilPassOperation?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L116)

The StencilOperation performed if the fragment stencil comparison test described by compare fails.

***

### stencilReadMask?[​](#stencilreadmask "Direct link to stencilReadMask?")

> `optional` **stencilReadMask?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L109)

Bitmask controlling which depthStencilAttachment stencil value bits are read when performing stencil comparison tests.

***

### stencilWriteMask?[​](#stencilwritemask "Direct link to stencilWriteMask?")

> `optional` **stencilWriteMask?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L111)

Bitmask controlling which depthStencilAttachment stencil value bits are written to when performing stencil operations.
