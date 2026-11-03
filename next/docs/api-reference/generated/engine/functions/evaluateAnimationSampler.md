# Function: evaluateAnimationSampler()

> **evaluateAnimationSampler**(`time`, `sampler`, `valueType?`): `number`\[] | `null`

Defined in: [modules/engine/src/animation/animation-interpolation.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-interpolation.ts#L22)

Samples keyframes without applying playback loops or modifying the supplied values.

## Parameters[​](#parameters "Direct link to Parameters")

### time[​](#time "Direct link to time")

`number`

### sampler[​](#sampler "Direct link to sampler")

[`AnimationSampler`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationSampler.md)

### valueType?[​](#valuetype "Direct link to valueType?")

[`AnimationValueType`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationValueType.md) = `'vector'`

## Returns[​](#returns "Direct link to Returns")

`number`\[] | `null`
