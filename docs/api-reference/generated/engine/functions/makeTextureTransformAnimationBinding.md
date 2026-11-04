# Function: makeTextureTransformAnimationBinding()

> **makeTextureTransformAnimationBinding**(`materials`, `target`, `state?`, `id?`): [`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/property-animation-binding.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/property-animation-binding.ts#L39)

Animates texture transforms relative to the authored UV transform.

## Parameters[​](#parameters "Direct link to Parameters")

### materials[​](#materials "Direct link to materials")

readonly [`Material`](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`>\[]

### target[​](#target "Direct link to target")

[`TextureTransformAnimationTarget`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureTransformAnimationTarget.md)

### state?[​](#state "Direct link to state?")

[`MaterialTextureTransformState`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MaterialTextureTransformState.md) = `...`

### id?[​](#id "Direct link to id?")

`string`

## Returns[​](#returns "Direct link to Returns")

[`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)
