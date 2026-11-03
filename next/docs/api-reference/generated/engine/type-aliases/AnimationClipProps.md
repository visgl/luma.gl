# Type Alias: AnimationClipProps

> **AnimationClipProps** = `object`

Defined in: [modules/engine/src/animation/animation-clip.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-clip.ts#L8)

Construction properties for a named, reusable animation clip.

## Properties[​](#properties "Direct link to Properties")

### duration?[​](#duration "Direct link to duration?")

> `optional` **duration?**: `number`

Defined in: [modules/engine/src/animation/animation-clip.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-clip.ts#L14)

Optional explicit clip duration, in seconds.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/animation/animation-clip.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-clip.ts#L10)

Application-visible clip name.

***

### tracks[​](#tracks "Direct link to tracks")

> **tracks**: [`AnimationTrack`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationTrack.md)\[]

Defined in: [modules/engine/src/animation/animation-clip.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-clip.ts#L12)

Tracks evaluated together whenever this clip plays.
