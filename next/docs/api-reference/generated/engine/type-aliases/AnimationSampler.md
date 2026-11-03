# Type Alias: AnimationSampler

> **AnimationSampler** = `object`

Defined in: [modules/engine/src/animation/animation-interpolation.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-interpolation.ts#L12)

Keyframe times and values in the glTF-compatible animation sampler layout.

## Properties[​](#properties "Direct link to Properties")

### input[​](#input "Direct link to input")

> **input**: readonly `number`\[]

Defined in: [modules/engine/src/animation/animation-interpolation.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-interpolation.ts#L14)

Keyframe times, in seconds.

***

### interpolation?[​](#interpolation "Direct link to interpolation?")

> `optional` **interpolation?**: [`AnimationInterpolation`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationInterpolation.md) | `string`

Defined in: [modules/engine/src/animation/animation-interpolation.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-interpolation.ts#L18)

Keyframe interpolation mode.

***

### output[​](#output "Direct link to output")

> **output**: readonly readonly `number`\[]\[]

Defined in: [modules/engine/src/animation/animation-interpolation.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-interpolation.ts#L16)

One value per keyframe, or in-tangent/value/out-tangent triples for cubic splines.
