# Class: AnimationTrack

Defined in: [modules/engine/src/animation/animation-track.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L39)

A typed, target-bound keyframe sequence shared by all scene formats.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationTrack**(`props`): `AnimationTrack`

Defined in: [modules/engine/src/animation/animation-track.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L47)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`AnimationTrackProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationTrackProps.md)

#### Returns[​](#returns "Direct link to Returns")

`AnimationTrack`

## Properties[​](#properties "Direct link to Properties")

### binding[​](#binding "Direct link to binding")

> `readonly` **binding**: [`AnimationBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationBinding.md)

Defined in: [modules/engine/src/animation/animation-track.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L45)

***

### interpolation[​](#interpolation "Direct link to interpolation")

> `readonly` **interpolation**: [`AnimationInterpolation`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationInterpolation.md)

Defined in: [modules/engine/src/animation/animation-track.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L43)

***

### name[​](#name "Direct link to name")

> `readonly` **name**: `string`

Defined in: [modules/engine/src/animation/animation-track.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L40)

***

### times[​](#times "Direct link to times")

> `readonly` **times**: readonly `number`\[]

Defined in: [modules/engine/src/animation/animation-track.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L41)

***

### values[​](#values "Direct link to values")

> `readonly` **values**: readonly readonly `number`\[]\[]

Defined in: [modules/engine/src/animation/animation-track.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L42)

***

### valueType[​](#valuetype "Direct link to valueType")

> `readonly` **valueType**: [`AnimationValueType`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationValueType.md)

Defined in: [modules/engine/src/animation/animation-track.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L44)

## Accessors[​](#accessors "Direct link to Accessors")

### duration[​](#duration "Direct link to duration")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **duration**(): `number`

Defined in: [modules/engine/src/animation/animation-track.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L57)

Last keyframe time, in seconds.

##### Returns[​](#returns-1 "Direct link to Returns")

`number`

***

### sampler[​](#sampler "Direct link to sampler")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **sampler**(): [`AnimationSampler`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationSampler.md)

Defined in: [modules/engine/src/animation/animation-track.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L62)

glTF-compatible read-only view of this track's keyframe data.

##### Returns[​](#returns-2 "Direct link to Returns")

[`AnimationSampler`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationSampler.md)

## Methods[​](#methods "Direct link to Methods")

### evaluate()[​](#evaluate "Direct link to evaluate()")

> **evaluate**(`time`): `number`\[] | `null`

Defined in: [modules/engine/src/animation/animation-track.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L67)

Evaluates the track at an already-resolved clip time, in seconds.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### time[​](#time "Direct link to time")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`number`\[] | `null`
