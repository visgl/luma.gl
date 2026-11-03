# Class: AnimationMixer

Defined in: [modules/engine/src/animation/animation-mixer.ts:233](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L233)

Coordinates reusable clip playback and blends tracks that share a target binding.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationMixer**(`clips?`): `AnimationMixer`

Defined in: [modules/engine/src/animation/animation-mixer.ts:241](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L241)

#### Parameters[​](#parameters "Direct link to Parameters")

##### clips?[​](#clips "Direct link to clips?")

[`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)\[] = `[]`

#### Returns[​](#returns "Direct link to Returns")

`AnimationMixer`

## Properties[​](#properties "Direct link to Properties")

### time[​](#time "Direct link to time")

> **time**: `number` = `0`

Defined in: [modules/engine/src/animation/animation-mixer.ts:234](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L234)

***

### timeScale[​](#timescale "Direct link to timeScale")

> **timeScale**: `number` = `1`

Defined in: [modules/engine/src/animation/animation-mixer.ts:235](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L235)

## Methods[​](#methods "Direct link to Methods")

### addClip()[​](#addclip "Direct link to addClip()")

> **addClip**(`clip`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:246](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L246)

Makes a named clip available for playback.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### clip[​](#clip "Direct link to clip")

[`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`this`

***

### advance()[​](#advance "Direct link to advance()")

> **advance**(`deltaTime`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:281](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L281)

Advances action clocks and crossfades without evaluating CPU-side animation tracks.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### deltaTime[​](#deltatime "Direct link to deltaTime")

`number`

#### Returns[​](#returns-2 "Direct link to Returns")

`this`

***

### clipAction()[​](#clipaction "Direct link to clipAction()")

> **clipAction**(`clip`, `props?`): [`AnimationAction`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationAction.md)

Defined in: [modules/engine/src/animation/animation-mixer.ts:252](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L252)

Returns the cached playback action for a clip or registered clip name.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### clip[​](#clip-1 "Direct link to clip")

`string` | [`AnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClip.md)

##### props?[​](#props "Direct link to props?")

[`AnimationActionProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationActionProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

[`AnimationAction`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationAction.md)

***

### getAction()[​](#getaction "Direct link to getAction()")

> **getAction**(`name`): [`AnimationAction`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationAction.md) | `undefined`

Defined in: [modules/engine/src/animation/animation-mixer.ts:268](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L268)

Returns a previously created named action, if present.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### name[​](#name "Direct link to name")

`string`

#### Returns[​](#returns-4 "Direct link to Returns")

[`AnimationAction`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationAction.md) | `undefined`

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`time`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:289](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L289)

Seeks every action to an absolute mixer time, in seconds.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### time[​](#time-1 "Direct link to time")

`number`

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

***

### stopAllAction()[​](#stopallaction "Direct link to stopAllAction()")

> **stopAllAction**(): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:301](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L301)

Stops and resets all registered playback actions.

#### Returns[​](#returns-6 "Direct link to Returns")

`this`

***

### update()[​](#update "Direct link to update()")

> **update**(`deltaTime`): `this`

Defined in: [modules/engine/src/animation/animation-mixer.ts:274](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-mixer.ts#L274)

Advances playback by seconds, then applies blended animation values.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### deltaTime[​](#deltatime-1 "Direct link to deltaTime")

`number`

#### Returns[​](#returns-7 "Direct link to Returns")

`this`
