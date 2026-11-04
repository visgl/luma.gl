# Type Alias: ModelDrawOptions

> **ModelDrawOptions** = `object`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L114)

Per-draw overrides shared by Model and GPUVectorModel.

## Properties[​](#properties "Direct link to Properties")

### parameters?[​](#parameters "Direct link to parameters?")

> `optional` **parameters?**: `object`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L116)

Dynamic parameters scoped to this draw, including internal vector batches.

#### blendConstant?[​](#blendconstant "Direct link to blendConstant?")

> `optional` **blendConstant?**: `NumberArray4`

Blend color used by constant blend factors.

#### scissorRect?[​](#scissorrect "Direct link to scissorRect?")

> `optional` **scissorRect?**: `NumberArray4`

Scissor rectangle \[x, y, width, height].

#### stencilReference?[​](#stencilreference "Direct link to stencilReference?")

> `optional` **stencilReference?**: `number`

Value used for stencil comparison and replacement.

#### viewport?[​](#viewport "Direct link to viewport?")

> `optional` **viewport?**: `NumberArray4` | `NumberArray6`

Viewport \[x, y, width, height, minDepth?, maxDepth?].
