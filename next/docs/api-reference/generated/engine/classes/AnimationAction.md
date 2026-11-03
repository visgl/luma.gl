# Class: AnimationAction

Defined in: [modules/engine/src/animation/animation-mixer.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L39)

Playback state and blend influence for a single animation clip.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationAction**(`mixer`, `clip`, `props?`): `AnimationAction`

Defined in: [modules/engine/src/animation/animation-mixer.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L53)

#### Parameters[​](#parameters "Direct link to Parameters")

##### mixer[​](#mixer "Direct link to mixer")

[`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md)

##### clip[​](#clip "Direct link to clip")

[`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

##### props?[​](#props "Direct link to props?")

[`AnimationActionProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationActionProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`AnimationAction`

## Properties[​](#properties "Direct link to Properties")

### clip[​](#clip-1 "Direct link to clip")

> `readonly` **clip**: [`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

Defined in: [modules/engine/src/animation/animation-mixer.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L40)

***

### loop[​](#loop "Direct link to loop")

> **loop**: [`AnimationLoopMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationLoopMode.md)

Defined in: [modules/engine/src/animation/animation-mixer.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L45)

***

### mixer[​](#mixer-1 "Direct link to mixer")

> `readonly` **mixer**: [`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md)

Defined in: [modules/engine/src/animation/animation-mixer.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L41)

***

### paused[​](#paused "Direct link to paused")

> **paused**: `boolean` = `false`

Defined in: [modules/engine/src/animation/animation-mixer.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L47)

***

### playing[​](#playing "Direct link to playing")

> **playing**: `boolean` = `false`

Defined in: [modules/engine/src/animation/animation-mixer.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L48)

***

### repetitions[​](#repetitions "Direct link to repetitions")

> **repetitions**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L46)

***

### time[​](#time "Direct link to time")

> **time**: `number` = `0`

Defined in: [modules/engine/src/animation/animation-mixer.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L42)

***

### timeScale[​](#timescale "Direct link to timeScale")

> **timeScale**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L43)

***

### weight[​](#weight "Direct link to weight")

> **weight**: `number`

Defined in: [modules/engine/src/animation/animation-mixer.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L44)

## Methods[​](#methods "Direct link to Methods")

### crossFadeFrom()[​](#crossfadefrom "Direct link to crossFadeFrom()")

> **crossFadeFrom**(`action`, `duration`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L143)

Fades another action out while this action fades in.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### action[​](#action "Direct link to action")

`AnimationAction`

##### duration[​](#duration "Direct link to duration")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`this`

***

### crossFadeTo()[​](#crossfadeto "Direct link to crossFadeTo()")

> **crossFadeTo**(`action`, `duration`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L136)

Fades this action out while another action fades in.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### action[​](#action-1 "Direct link to action")

`AnimationAction`

##### duration[​](#duration-1 "Direct link to duration")

`number`

#### Returns[​](#returns-2 "Direct link to Returns")

`this`

***

### fadeIn()[​](#fadein "Direct link to fadeIn()")

> **fadeIn**(`duration`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L126)

Fades this action's current weight to full influence.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### duration[​](#duration-2 "Direct link to duration")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`this`

***

### fadeOut()[​](#fadeout "Direct link to fadeOut()")

> **fadeOut**(`duration`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L131)

Fades this action's current weight to zero influence.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### duration[​](#duration-3 "Direct link to duration")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

`this`

***

### pause()[​](#pause "Direct link to pause()")

> **pause**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L70)

Temporarily suspends playback while preserving local time.

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

***

### play()[​](#play "Direct link to play()")

> **play**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L63)

Starts or resumes playback.

#### Returns[​](#returns-6 "Direct link to Returns")

`this`

***

### reset()[​](#reset "Direct link to reset()")

> **reset**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L91)

Restores the initial clip time without changing playback state.

#### Returns[​](#returns-7 "Direct link to Returns")

`this`

***

### resume()[​](#resume "Direct link to resume()")

> **resume**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L76)

Continues playback after pausing.

#### Returns[​](#returns-8 "Direct link to Returns")

`this`

***

### setEffectiveTimeScale()[​](#seteffectivetimescale "Direct link to setEffectiveTimeScale()")

> **setEffectiveTimeScale**(`timeScale`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L120)

Sets the action's playback speed and direction.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### timeScale[​](#timescale-1 "Direct link to timeScale")

`number`

#### Returns[​](#returns-9 "Direct link to Returns")

`this`

***

### setEffectiveWeight()[​](#seteffectiveweight "Direct link to setEffectiveWeight()")

> **setEffectiveWeight**(`weight`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L113)

Sets the action's blend contribution.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### weight[​](#weight-1 "Direct link to weight")

`number`

#### Returns[​](#returns-10 "Direct link to Returns")

`this`

***

### setLoop()[​](#setloop "Direct link to setLoop()")

> **setLoop**(`loop`, `repetitions?`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L105)

Selects playback loop behavior and an optional traversal count.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### loop[​](#loop-1 "Direct link to loop")

[`AnimationLoopMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationLoopMode.md)

##### repetitions?[​](#repetitions-1 "Direct link to repetitions?")

`number` = `Number.POSITIVE_INFINITY`

#### Returns[​](#returns-11 "Direct link to Returns")

`this`

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`time`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L98)

Seeks to the supplied elapsed clip time, in seconds.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### time[​](#time-1 "Direct link to time")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`this`

***

### stop()[​](#stop "Direct link to stop()")

> **stop**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L83)

Stops playback and restores the initial clip time.

#### Returns[​](#returns-13 "Direct link to Returns")

`this`
