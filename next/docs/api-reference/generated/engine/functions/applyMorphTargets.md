# Function: applyMorphTargets()

> **applyMorphTargets**(`baseAttributes`, `targets`, `weights`): [`MorphTargetAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MorphTargetAttributes.md)

Defined in: [modules/engine/src/animation/morph-targets.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/morph-targets.ts#L40)

Applies weighted morph deltas without modifying the immutable source vertex attributes.

## Parameters[​](#parameters "Direct link to Parameters")

### baseAttributes[​](#baseattributes "Direct link to baseAttributes")

`Readonly`<[`MorphTargetAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MorphTargetAttributes.md)>

### targets[​](#targets "Direct link to targets")

readonly `Readonly`<[`MorphTargetAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MorphTargetAttributes.md)>\[]

### weights[​](#weights "Direct link to weights")

readonly `number`\[]

## Returns[​](#returns "Direct link to Returns")

[`MorphTargetAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MorphTargetAttributes.md)
