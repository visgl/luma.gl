# Function: makeMaterialAnimationBinding()

> **makeMaterialAnimationBinding**(`materials`, `target`, `id?`): [`AnimationBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/property-animation-binding.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/property-animation-binding.ts#L24)

Binds resolved material instances, including inactive material variants.

## Parameters[​](#parameters "Direct link to Parameters")

### materials[​](#materials "Direct link to materials")

readonly [`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`>\[]

### target[​](#target "Direct link to target")

[`MaterialAnimationTarget`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MaterialAnimationTarget.md)

### id?[​](#id "Direct link to id?")

`string`

## Returns[​](#returns "Direct link to Returns")

[`AnimationBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)
