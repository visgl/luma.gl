# Class: MixerAnimationClip

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L104)

A reusable clip controller backed by an engine mixer action.

## Extends[​](#extends "Direct link to Extends")

* [`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new MixerAnimationClip**(`clip`, `mixer?`): `MixerAnimationClip`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L106)

#### Parameters[​](#parameters "Direct link to Parameters")

##### clip[​](#clip "Direct link to clip")

[`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

##### mixer?[​](#mixer "Direct link to mixer?")

[`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md) = `...`

#### Returns[​](#returns "Direct link to Returns")

`MixerAnimationClip`

#### Overrides[​](#overrides "Direct link to Overrides")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### action[​](#action "Direct link to action")

> `readonly` **action**: [`AnimationAction`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationAction.md)

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L105)

***

### clip[​](#clip-1 "Direct link to clip")

> `readonly` **clip**: [`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L107)

***

### mixer[​](#mixer-1 "Direct link to mixer")

> `readonly` **mixer**: [`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md)

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L108)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/animation/animator.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L22)

Application-visible clip name.

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`name`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#name)

***

### playing[​](#playing "Direct link to playing")

> **playing**: `boolean` = `true`

Defined in: [modules/engine/src/animation/animator.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L24)

Whether playback is currently enabled.

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`playing`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#playing)

***

### speed[​](#speed "Direct link to speed")

> **speed**: `number` = `1`

Defined in: [modules/engine/src/animation/animator.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L26)

Playback speed multiplier.

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`speed`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#speed)

***

### startTime[​](#starttime "Direct link to startTime")

> **startTime**: `number` = `0`

Defined in: [modules/engine/src/animation/animator.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L28)

Start time in seconds relative to wall-clock playback time.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`startTime`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#starttime)

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

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md).[`setTime`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md#settime)
