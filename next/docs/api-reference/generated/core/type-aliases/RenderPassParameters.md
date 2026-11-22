# Type Alias: RenderPassParameters

> **RenderPassParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:193](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L193)

These parameters are set on the render pass and are thus easy to change frequently

## Properties[​](#properties "Direct link to Properties")

### blendConstant?[​](#blendconstant "Direct link to blendConstant?")

> `optional` **blendConstant?**: `NumberArray4`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:199](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L199)

Sets constant blend color and alpha values used with "constant" and "one-minus-constant" blend factors.

***

### scissorRect?[​](#scissorrect "Direct link to scissorRect?")

> `optional` **scissorRect?**: `NumberArray4` | `null`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:197](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L197)

Scissor rectangle \[x, y, width, height], or null to disable clipping to a rectangle.

***

### stencilReference?[​](#stencilreference "Direct link to stencilReference?")

> `optional` **stencilReference?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:201](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L201)

Stencil operation "replace" sets the value to stencilReference

***

### viewport?[​](#viewport "Direct link to viewport?")

> `optional` **viewport?**: `NumberArray4` | `NumberArray6`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:195](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L195)

Linear map from normalized device coordinates to viewport coordinates \[x, y, width, height, minDepth, maxDepth]
