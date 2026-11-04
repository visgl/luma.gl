# Class: KeyFrames\<T>

Defined in: [modules/engine/src/animation/key-frames.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L9)

Holds a list of key frames (timestamped values)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` = `number`

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new KeyFrames**<`T`>(`keyFrames`): `KeyFrames`<`T`>

Defined in: [modules/engine/src/animation/key-frames.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L17)

#### Parameters[​](#parameters "Direct link to Parameters")

##### keyFrames[​](#keyframes "Direct link to keyFrames")

`KeyFrame`<`T`>\[]

#### Returns[​](#returns "Direct link to Returns")

`KeyFrames`<`T`>

## Properties[​](#properties "Direct link to Properties")

### endIndex[​](#endindex "Direct link to endIndex")

> **endIndex**: `number` = `-1`

Defined in: [modules/engine/src/animation/key-frames.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L11)

***

### factor[​](#factor "Direct link to factor")

> **factor**: `number` = `0`

Defined in: [modules/engine/src/animation/key-frames.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L12)

***

### startIndex[​](#startindex "Direct link to startIndex")

> **startIndex**: `number` = `-1`

Defined in: [modules/engine/src/animation/key-frames.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L10)

***

### times[​](#times "Direct link to times")

> **times**: `number`\[] = `[]`

Defined in: [modules/engine/src/animation/key-frames.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L13)

***

### values[​](#values "Direct link to values")

> **values**: `T`\[] = `[]`

Defined in: [modules/engine/src/animation/key-frames.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L14)

## Methods[​](#methods "Direct link to Methods")

### \_calculateKeys()[​](#_calculatekeys "Direct link to _calculateKeys()")

> **\_calculateKeys**(`time`): `void`

Defined in: [modules/engine/src/animation/key-frames.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L60)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### time[​](#time "Direct link to time")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### getEndData()[​](#getenddata "Direct link to getEndData()")

> **getEndData**(): `T`

Defined in: [modules/engine/src/animation/key-frames.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L56)

#### Returns[​](#returns-2 "Direct link to Returns")

`T`

***

### getEndTime()[​](#getendtime "Direct link to getEndTime()")

> **getEndTime**(): `number`

Defined in: [modules/engine/src/animation/key-frames.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L48)

#### Returns[​](#returns-3 "Direct link to Returns")

`number`

***

### getStartData()[​](#getstartdata "Direct link to getStartData()")

> **getStartData**(): `T`

Defined in: [modules/engine/src/animation/key-frames.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L52)

#### Returns[​](#returns-4 "Direct link to Returns")

`T`

***

### getStartTime()[​](#getstarttime "Direct link to getStartTime()")

> **getStartTime**(): `number`

Defined in: [modules/engine/src/animation/key-frames.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L44)

#### Returns[​](#returns-5 "Direct link to Returns")

`number`

***

### setKeyFrames()[​](#setkeyframes "Direct link to setKeyFrames()")

> **setKeyFrames**(`keyFrames`): `void`

Defined in: [modules/engine/src/animation/key-frames.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L22)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### keyFrames[​](#keyframes-1 "Direct link to keyFrames")

`KeyFrame`<`T`>\[]

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`time`): `void`

Defined in: [modules/engine/src/animation/key-frames.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/key-frames.ts#L35)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### time[​](#time-1 "Direct link to time")

`number`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`
