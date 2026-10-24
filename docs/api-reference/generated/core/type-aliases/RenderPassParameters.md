# Type Alias: RenderPassParameters

> **RenderPassParameters** = `object`

Defined in: [modules/core/src/adapter/types/parameters.ts:185](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L185)

These parameters are set on the render pass and are thus easy to change frequently

## Properties[​](#properties "Direct link to Properties")

### blendConstant?[​](#blendconstant "Direct link to blendConstant?")

> `optional` **blendConstant?**: `NumberArray4`

Defined in: [modules/core/src/adapter/types/parameters.ts:191](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L191)

Sets constant blend color and alpha values used with "constant" and "one-minus-constant" blend factors.

***

### colorMask?[​](#colormask "Direct link to colorMask?")

> `optional` **colorMask?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:196](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L196)

Bitmask controlling which channels are are written to when drawing/clearing. defaulting to 0xF

***

### scissorRect?[​](#scissorrect "Direct link to scissorRect?")

> `optional` **scissorRect?**: `NumberArray4`

Defined in: [modules/core/src/adapter/types/parameters.ts:189](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L189)

Sets scissor rectangle used during rasterization. Discards fragments outside viewport coords \[x, y, width, height].

***

### stencilReference?[​](#stencilreference "Direct link to stencilReference?")

> `optional` **stencilReference?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:193](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L193)

Stencil operation "replace" sets the value to stencilReference

***

### viewport?[​](#viewport "Direct link to viewport?")

> `optional` **viewport?**: `NumberArray4` | `NumberArray6`

Defined in: [modules/core/src/adapter/types/parameters.ts:187](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L187)

Linear map from normalized device coordinates to viewport coordinates \[x, y, width, height, minDepth, maxDepth]
