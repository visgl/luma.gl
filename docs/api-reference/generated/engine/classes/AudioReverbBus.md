# Class: AudioReverbBus

Defined in: [modules/engine/src/audio/audio-environment.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L83)

Owns an impulse-response return bus; the decoded response and destinations are borrowed.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AudioReverbBus**(`context`, `response`, `destination`, `options?`): `AudioReverbBus`

Defined in: [modules/engine/src/audio/audio-environment.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L89)

#### Parameters[​](#parameters "Direct link to Parameters")

##### context[​](#context "Direct link to context")

`BaseAudioContext`

##### response[​](#response "Direct link to response")

`AudioBuffer`

##### destination[​](#destination "Direct link to destination")

`AudioNode`

##### options?[​](#options "Direct link to options?")

###### mix?[​](#mix "Direct link to mix?")

`number`

###### normalize?[​](#normalize "Direct link to normalize?")

`boolean`

#### Returns[​](#returns "Direct link to Returns")

`AudioReverbBus`

## Properties[​](#properties "Direct link to Properties")

### convolver[​](#convolver "Direct link to convolver")

> **convolver**: `ConvolverNode`

Defined in: [modules/engine/src/audio/audio-environment.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L85)

***

### input[​](#input "Direct link to input")

> `readonly` **input**: `GainNode`

Defined in: [modules/engine/src/audio/audio-environment.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L84)

***

### output[​](#output "Direct link to output")

> `readonly` **output**: `GainNode`

Defined in: [modules/engine/src/audio/audio-environment.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L86)

## Methods[​](#methods "Direct link to Methods")

### connectSend()[​](#connectsend "Direct link to connectSend()")

> **connectSend**(`source`, `level`): `GainNode`

Defined in: [modules/engine/src/audio/audio-environment.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L106)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### source[​](#source "Direct link to source")

`AudioNode`

##### level[​](#level "Direct link to level")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`GainNode`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/audio/audio-environment.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L127)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### reset()[​](#reset "Direct link to reset()")

> **reset**(): `void`

Defined in: [modules/engine/src/audio/audio-environment.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L116)

Replace convolution state so stopped playback cannot leak its tail into a restart.

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
