# Function: makeNodeAnimationBinding()

> **makeNodeAnimationBinding**(`node`, `property`, `options?`): [`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/node-animation-binding.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/node-animation-binding.ts#L12)

Bind a property once to a node reference; playback does not resolve asset IDs.

## Parameters[​](#parameters "Direct link to Parameters")

### node[​](#node "Direct link to node")

[`GroupNode`](https://luma.gl/docs/api-reference/generated/engine/classes/GroupNode.md)

### property[​](#property "Direct link to property")

[`NodeAnimationProperty`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/NodeAnimationProperty.md)

### options?[​](#options "Direct link to options?")

#### id?[​](#id "Direct link to id?")

`string`

#### onVisibilityChange?[​](#onvisibilitychange "Direct link to onVisibilityChange?")

() => `void`

## Returns[​](#returns "Direct link to Returns")

[`AnimationBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)
