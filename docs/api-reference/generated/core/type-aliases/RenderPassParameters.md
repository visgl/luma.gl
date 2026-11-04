# Type Alias: RenderPassParameters

> **RenderPassParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L177)

These parameters are set on the render pass and are thus easy to change frequently

## Properties[​](#properties "Direct link to Properties")

### blendConstant?[​](#blendconstant "Direct link to blendConstant?")

> `optional` **blendConstant?**: `NumberArray4`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:183](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L183)

Sets constant blend color and alpha values used with "constant" and "one-minus-constant" blend factors.

***

### scissorRect?[​](#scissorrect "Direct link to scissorRect?")

> `optional` **scissorRect?**: `NumberArray4`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L181)

Sets scissor rectangle used during rasterization. Discards fragments outside viewport coords \[x, y, width, height].

***

### stencilReference?[​](#stencilreference "Direct link to stencilReference?")

> `optional` **stencilReference?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:185](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L185)

Stencil operation "replace" sets the value to stencilReference

***

### viewport?[​](#viewport "Direct link to viewport?")

> `optional` **viewport?**: `NumberArray4` | `NumberArray6`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:179](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L179)

Linear map from normalized device coordinates to viewport coordinates \[x, y, width, height, minDepth, maxDepth]
