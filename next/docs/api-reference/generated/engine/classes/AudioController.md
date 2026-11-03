# Class: AudioController

Defined in: [modules/engine/src/audio/audio-controller.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L113)

Scene-bound Web Audio playback, independent of the asset format and GPU backend.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AudioController**(`options`): `AudioController`

Defined in: [modules/engine/src/audio/audio-controller.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L140)

#### Parameters[​](#parameters "Direct link to Parameters")

##### options[​](#options "Direct link to options")

[`AudioControllerOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioControllerOptions.md)

#### Returns[​](#returns "Direct link to Returns")

`AudioController`

## Properties[​](#properties "Direct link to Properties")

### definition[​](#definition "Direct link to definition")

> `readonly` **definition**: [`AudioDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioDefinition.md)

Defined in: [modules/engine/src/audio/audio-controller.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L115)

***

### gain[​](#gain "Direct link to gain")

> `readonly` **gain**: `GainNode`

Defined in: [modules/engine/src/audio/audio-controller.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L114)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/audio/audio-controller.ts:408](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L408)

Disconnect owned nodes and cancel pending loads; never closes the borrowed context.

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### initialize()[​](#initialize "Direct link to initialize()")

> **initialize**(): `Promise`<`void`>

Defined in: [modules/engine/src/audio/audio-controller.ts:189](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L189)

Fetch and decode once. Safe to call repeatedly; does not start playback.

#### Returns[​](#returns-2 "Direct link to Returns")

`Promise`<`void`>

***

### play()[​](#play "Direct link to play()")

> **play**(`options?`): `Promise`<`void`>

Defined in: [modules/engine/src/audio/audio-controller.ts:199](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L199)

Restart sources. Resume the application's AudioContext from a user gesture first.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### options?[​](#options-1 "Direct link to options?")

###### autoplayOnly?[​](#autoplayonly "Direct link to autoplayOnly?")

`boolean`

###### restart?[​](#restart "Direct link to restart?")

`boolean`

###### sourceIndices?[​](#sourceindices "Direct link to sourceIndices?")

readonly `number`\[]

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<`void`>

***

### setGraphGain()[​](#setgraphgain "Direct link to setGraphGain()")

> **setGraphGain**(`graphIndex`, `nodeIndex`, `gain`): `void`

Defined in: [modules/engine/src/audio/audio-controller.ts:227](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L227)

Change a graph gain using its authored interpolation and duration.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### graphIndex[​](#graphindex "Direct link to graphIndex")

`number`

##### nodeIndex[​](#nodeindex "Direct link to nodeIndex")

`number`

##### gain[​](#gain-1 "Direct link to gain")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### stop()[​](#stop "Direct link to stop()")

> **stop**(): `void`

Defined in: [modules/engine/src/audio/audio-controller.ts:299](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L299)

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### update()[​](#update "Direct link to update()")

> **update**(`listenerMatrix`): `void`

Defined in: [modules/engine/src/audio/audio-controller.ts:312](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L312)

Call after animation updates, with the camera's inverse view matrix. Distances are in meters.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### listenerMatrix[​](#listenermatrix "Direct link to listenerMatrix")

`Matrix4`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`
