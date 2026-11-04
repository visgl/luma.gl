# Type Alias: AudioDefinition

> **AudioDefinition** = `object`

Defined in: [modules/engine/src/audio/audio-controller.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L34)

Source-independent audio assets, scheduled sources, and spatial emitters.

## Properties[​](#properties "Direct link to Properties")

### audio[​](#audio "Direct link to audio")

> **audio**: `object`\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L36)

Embedded bytes are borrowed; only selected clips are copied before decode can detach them.

#### data?[​](#data "Direct link to data?")

> `optional` **data?**: `ArrayBuffer` | `ArrayBufferView`

#### mimeType?[​](#mimetype "Direct link to mimeType?")

> `optional` **mimeType?**: `string`

#### uri?[​](#uri "Direct link to uri?")

> `optional` **uri?**: `string`

***

### emitters[​](#emitters "Direct link to emitters")

> **emitters**: `object`\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L45)

#### environment?[​](#environment "Direct link to environment?")

> `optional` **environment?**: `object`

##### environment.directLevel?[​](#environmentdirectlevel "Direct link to environment.directLevel?")

> `optional` **directLevel?**: `number`

##### environment.environment?[​](#environmentenvironment "Direct link to environment.environment?")

> `optional` **environment?**: `number`

##### environment.reverbLevel?[​](#environmentreverblevel "Direct link to environment.reverbLevel?")

> `optional` **reverbLevel?**: `number`

#### gain?[​](#gain "Direct link to gain?")

> `optional` **gain?**: `number`

#### name?[​](#name "Direct link to name?")

> `optional` **name?**: `string`

#### positional?[​](#positional "Direct link to positional?")

> `optional` **positional?**: `object`

##### positional.airAbsorption?[​](#positionalairabsorption "Direct link to positional.airAbsorption?")

> `optional` **airAbsorption?**: `object`

##### positional.airAbsorption.cutoffAtMaxDistance?[​](#positionalairabsorptioncutoffatmaxdistance "Direct link to positional.airAbsorption.cutoffAtMaxDistance?")

> `optional` **cutoffAtMaxDistance?**: `number`

##### positional.airAbsorption.enabled?[​](#positionalairabsorptionenabled "Direct link to positional.airAbsorption.enabled?")

> `optional` **enabled?**: `boolean`

##### positional.coneInnerAngle?[​](#positionalconeinnerangle "Direct link to positional.coneInnerAngle?")

> `optional` **coneInnerAngle?**: `number`

##### positional.coneOuterAngle?[​](#positionalconeouterangle "Direct link to positional.coneOuterAngle?")

> `optional` **coneOuterAngle?**: `number`

##### positional.coneOuterGain?[​](#positionalconeoutergain "Direct link to positional.coneOuterGain?")

> `optional` **coneOuterGain?**: `number`

##### positional.distanceModel?[​](#positionaldistancemodel "Direct link to positional.distanceModel?")

> `optional` **distanceModel?**: `DistanceModelType`

##### positional.maxDistance?[​](#positionalmaxdistance "Direct link to positional.maxDistance?")

> `optional` **maxDistance?**: `number`

##### positional.refDistance?[​](#positionalrefdistance "Direct link to positional.refDistance?")

> `optional` **refDistance?**: `number`

##### positional.rolloffFactor?[​](#positionalrollofffactor "Direct link to positional.rolloffFactor?")

> `optional` **rolloffFactor?**: `number`

##### positional.shapeType?[​](#positionalshapetype "Direct link to positional.shapeType?")

> `optional` **shapeType?**: `"omnidirectional"` | `"cone"`

#### sources?[​](#sources "Direct link to sources?")

> `optional` **sources?**: `number`\[]

#### type[​](#type "Direct link to type")

> **type**: `"global"` | `"positional"`

***

### sources[​](#sources-1 "Direct link to sources")

> **sources**: `object`\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L37)

#### audio?[​](#audio-1 "Direct link to audio?")

> `optional` **audio?**: `number`

#### autoPlay?[​](#autoplay "Direct link to autoPlay?")

> `optional` **autoPlay?**: `boolean`

#### gain?[​](#gain-1 "Direct link to gain?")

> `optional` **gain?**: `number`

#### graph?[​](#graph "Direct link to graph?")

> `optional` **graph?**: [`AudioSourceProperties`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AudioSourceProperties.md)

#### loop?[​](#loop "Direct link to loop?")

> `optional` **loop?**: `boolean`

#### playbackRate?[​](#playbackrate "Direct link to playbackRate?")

> `optional` **playbackRate?**: `number`
