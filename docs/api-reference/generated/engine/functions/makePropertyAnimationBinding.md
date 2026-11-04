# Function: makePropertyAnimationBinding()

> **makePropertyAnimationBinding**(`object`, `property`, `options?`): [`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/property-animation-binding.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/property-animation-binding.ts#L55)

Binds an already resolved camera or light property; source addressing is import-time work.

## Parameters[​](#parameters "Direct link to Parameters")

### object[​](#object "Direct link to object")

`Record`<`string`, `any`>

### property[​](#property "Direct link to property")

`string`

### options?[​](#options "Direct link to options?")

#### component?[​](#component "Direct link to component?")

`number`

#### id?[​](#id "Direct link to id?")

`string`

#### onChange?[​](#onchange "Direct link to onChange?")

() => `void`

## Returns[​](#returns "Direct link to Returns")

[`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)
