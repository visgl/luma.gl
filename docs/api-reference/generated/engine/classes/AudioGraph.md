# Class: AudioGraph

Defined in: [modules/engine/src/audio/audio-graph.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L47)

Owns only processing nodes. Scheduled sources and destination nodes remain caller-owned.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AudioGraph**(`definition`, `context`, `destination`, `getEmitterInputs`): `AudioGraph`

Defined in: [modules/engine/src/audio/audio-graph.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L49)

#### Parameters[​](#parameters "Direct link to Parameters")

##### definition[​](#definition "Direct link to definition")

[`AudioGraphDefinition`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AudioGraphDefinition.md)

##### context[​](#context "Direct link to context")

`BaseAudioContext`

##### destination[​](#destination "Direct link to destination")

`AudioNode`

##### getEmitterInputs[​](#getemitterinputs "Direct link to getEmitterInputs")

(`index`) => readonly `AudioNode`\[]

#### Returns[​](#returns "Direct link to Returns")

`AudioGraph`

## Properties[​](#properties "Direct link to Properties")

### definition[​](#definition-1 "Direct link to definition")

> `readonly` **definition**: [`AudioGraphDefinition`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AudioGraphDefinition.md)

Defined in: [modules/engine/src/audio/audio-graph.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L50)

***

### nodes[​](#nodes "Direct link to nodes")

> `readonly` **nodes**: `AudioNode`\[] = `[]`

Defined in: [modules/engine/src/audio/audio-graph.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L48)

## Methods[​](#methods "Direct link to Methods")

### connectSource()[​](#connectsource "Direct link to connectSource()")

> **connectSource**(`index`, `source`): `void`

Defined in: [modules/engine/src/audio/audio-graph.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L139)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### index[​](#index "Direct link to index")

`number`

##### source[​](#source "Direct link to source")

`AudioNode`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/audio/audio-graph.ts:172](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L172)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### setGain()[​](#setgain "Direct link to setGain()")

> **setGain**(`index`, `gain`, `time?`): `void`

Defined in: [modules/engine/src/audio/audio-graph.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-graph.ts#L147)

Apply a scene-driven gain change using the authored transition shape.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### index[​](#index-1 "Direct link to index")

`number`

##### gain[​](#gain "Direct link to gain")

`number`

##### time?[​](#time "Direct link to time?")

`number` = `...`

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
