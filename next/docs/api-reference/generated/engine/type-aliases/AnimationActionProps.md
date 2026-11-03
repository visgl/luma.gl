# Type Alias: AnimationActionProps

> **AnimationActionProps** = `object`

Defined in: [modules/engine/src/animation/animation-mixer.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L13)

Optional initial playback properties for a clip action.

## Properties[​](#properties "Direct link to Properties")

### loop?[​](#loop "Direct link to loop?")

> `optional` **loop?**: [`AnimationLoopMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationLoopMode.md)

Defined in: [modules/engine/src/animation/animation-mixer.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L15)

Playback loop behavior.

***

### repetitions?[​](#repetitions "Direct link to repetitions?")

> `optional` **repetitions?**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L17)

Number of playback traversals before a repeating action finishes.

***

### timeScale?[​](#timescale "Direct link to timeScale?")

> `optional` **timeScale?**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L19)

Playback speed and direction.

***

### weight?[​](#weight "Direct link to weight?")

> `optional` **weight?**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L21)

Blend contribution relative to other actions.
