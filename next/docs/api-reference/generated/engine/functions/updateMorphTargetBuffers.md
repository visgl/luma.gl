# Function: updateMorphTargetBuffers()

> **updateMorphTargetBuffers**(`model`, `geometry`, `targets`, `weights`): `void`

Defined in: [modules/engine/src/animation/morph-targets.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/morph-targets.ts#L90)

Rewrites an existing model vertex buffer while preserving its canonical interleaved layout.

## Parameters[​](#parameters "Direct link to Parameters")

### model[​](#model "Direct link to model")

[`Model`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Model.md)

### geometry[​](#geometry "Direct link to geometry")

[`Geometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Geometry.md)

### targets[​](#targets "Direct link to targets")

readonly `Readonly`<[`MorphTargetAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MorphTargetAttributes.md)>\[]

### weights[​](#weights "Direct link to weights")

readonly `number`\[]

## Returns[​](#returns "Direct link to Returns")

`void`
