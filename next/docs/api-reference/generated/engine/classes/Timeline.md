# Class: Timeline

Defined in: [modules/engine/src/animation/timeline.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L41)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Timeline**(): `Timeline`

Defined in: [modules/engine/src/animation/timeline.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L48)

#### Returns[​](#returns "Direct link to Returns")

`Timeline`

## Properties[​](#properties "Direct link to Properties")

### animations[​](#animations "Direct link to animations")

> **animations**: `Map`<`number`, `Animation`>

Defined in: [modules/engine/src/animation/timeline.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L44)

***

### channels[​](#channels "Direct link to channels")

> **channels**: `Map`<`number`, `Channel`>

Defined in: [modules/engine/src/animation/timeline.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L43)

***

### lastEngineTime[​](#lastenginetime "Direct link to lastEngineTime")

> **lastEngineTime**: `number` = `-1`

Defined in: [modules/engine/src/animation/timeline.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L46)

***

### playing[​](#playing "Direct link to playing")

> **playing**: `boolean` = `false`

Defined in: [modules/engine/src/animation/timeline.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L45)

***

### time[​](#time "Direct link to time")

> **time**: `number` = `0`

Defined in: [modules/engine/src/animation/timeline.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L42)

## Methods[​](#methods "Direct link to Methods")

### \_setChannelTime()[​](#_setchanneltime "Direct link to _setChannelTime()")

> **\_setChannelTime**(`channel`, `time`): `void`

Defined in: [modules/engine/src/animation/timeline.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L155)

#### Parameters[​](#parameters "Direct link to Parameters")

##### channel[​](#channel "Direct link to channel")

`Channel`

##### time[​](#time-1 "Direct link to time")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### addChannel()[​](#addchannel "Direct link to addChannel()")

> **addChannel**(`props`): `number`

Defined in: [modules/engine/src/animation/timeline.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L50)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

`ChannelOptions`

#### Returns[​](#returns-2 "Direct link to Returns")

`number`

***

### attachAnimation()[​](#attachanimation "Direct link to attachAnimation()")

> **attachAnimation**(`animation`, `channelHandle?`): `number`

Defined in: [modules/engine/src/animation/timeline.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L128)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### animation[​](#animation "Direct link to animation")

`AnimationOptions`

##### channelHandle?[​](#channelhandle "Direct link to channelHandle?")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`number`

***

### detachAnimation()[​](#detachanimation "Direct link to detachAnimation()")

> **detachAnimation**(`channelId`): `void`

Defined in: [modules/engine/src/animation/timeline.ts:141](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L141)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### channelId[​](#channelid "Direct link to channelId")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### getTime()[​](#gettime "Direct link to getTime()")

> **getTime**(`channelId?`): `number`

Defined in: [modules/engine/src/animation/timeline.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L86)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### channelId?[​](#channelid-1 "Direct link to channelId?")

`number`

#### Returns[​](#returns-5 "Direct link to Returns")

`number`

***

### isFinished()[​](#isfinished "Direct link to isFinished()")

> **isFinished**(`channelId`): `boolean`

Defined in: [modules/engine/src/animation/timeline.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L77)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### channelId[​](#channelid-2 "Direct link to channelId")

`number`

#### Returns[​](#returns-6 "Direct link to Returns")

`boolean`

***

### pause()[​](#pause "Direct link to pause()")

> **pause**(): `void`

Defined in: [modules/engine/src/animation/timeline.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L119)

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### play()[​](#play "Direct link to play()")

> **play**(): `void`

Defined in: [modules/engine/src/animation/timeline.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L115)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### removeChannel()[​](#removechannel "Direct link to removeChannel()")

> **removeChannel**(`channelId`): `void`

Defined in: [modules/engine/src/animation/timeline.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L67)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### channelId[​](#channelid-3 "Direct link to channelId")

`number`

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

***

### reset()[​](#reset "Direct link to reset()")

> **reset**(): `void`

Defined in: [modules/engine/src/animation/timeline.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L124)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`time`): `void`

Defined in: [modules/engine/src/animation/timeline.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L100)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### time[​](#time-2 "Direct link to time")

`number`

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

***

### update()[​](#update "Direct link to update()")

> **update**(`engineTime`): `void`

Defined in: [modules/engine/src/animation/timeline.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/timeline.ts#L145)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### engineTime[​](#enginetime "Direct link to engineTime")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`void`
