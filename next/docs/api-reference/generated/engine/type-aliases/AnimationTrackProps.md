# Type Alias: AnimationTrackProps

> **AnimationTrackProps** = `object`

Defined in: [modules/engine/src/animation/animation-track.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L23)

Construction properties for a reusable keyframe track.

## Properties[​](#properties "Direct link to Properties")

### binding[​](#binding "Direct link to binding")

> **binding**: [`AnimationBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/animation-track.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L35)

Target property updated when the track is played.

***

### interpolation?[​](#interpolation "Direct link to interpolation?")

> `optional` **interpolation?**: [`AnimationInterpolation`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationInterpolation.md)

Defined in: [modules/engine/src/animation/animation-track.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L31)

Interpolation between adjacent keyframes.

***

### name?[​](#name "Direct link to name?")

> `optional` **name?**: `string`

Defined in: [modules/engine/src/animation/animation-track.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L25)

Application-visible track name.

***

### times[​](#times "Direct link to times")

> **times**: readonly `number`\[]

Defined in: [modules/engine/src/animation/animation-track.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L27)

Keyframe times, in seconds.

***

### values[​](#values "Direct link to values")

> **values**: readonly readonly `number`\[]\[]

Defined in: [modules/engine/src/animation/animation-track.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L29)

Keyframe values, including glTF-compatible cubic spline tangent triples.

***

### valueType?[​](#valuetype "Direct link to valueType?")

> `optional` **valueType?**: [`AnimationValueType`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationValueType.md)

Defined in: [modules/engine/src/animation/animation-track.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L33)

Value interpretation used during interpolation and blending.
