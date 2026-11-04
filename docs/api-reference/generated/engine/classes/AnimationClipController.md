# Abstract Class: AnimationClipController

Defined in: [modules/engine/src/animation/animator.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L20)

Generic playback controller for one animation clip.

## Extended by[​](#extended-by "Direct link to Extended by")

* [`MixerAnimationClip`](https://luma.gl/docs/api-reference/generated/engine/classes/MixerAnimationClip.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationClipController**(`props?`): `AnimationClipController`

Defined in: [modules/engine/src/animation/animator.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L30)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`AnimationClipControllerProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationClipControllerProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`AnimationClipController`

## Properties[​](#properties "Direct link to Properties")

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/animation/animator.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L22)

Application-visible clip name.

***

### playing[​](#playing "Direct link to playing")

> **playing**: `boolean` = `true`

Defined in: [modules/engine/src/animation/animator.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L24)

Whether playback is currently enabled.

***

### speed[​](#speed "Direct link to speed")

> **speed**: `number` = `1`

Defined in: [modules/engine/src/animation/animator.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L26)

Playback speed multiplier.

***

### startTime[​](#starttime "Direct link to startTime")

> **startTime**: `number` = `0`

Defined in: [modules/engine/src/animation/animator.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L28)

Start time in seconds relative to wall-clock playback time.

## Methods[​](#methods "Direct link to Methods")

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`timeMs`): `void`

Defined in: [modules/engine/src/animation/animator.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L36)

Advances the clip to the supplied wall-clock time in milliseconds.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### timeMs[​](#timems "Direct link to timeMs")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`
