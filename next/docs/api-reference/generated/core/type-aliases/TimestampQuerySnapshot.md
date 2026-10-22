# Type Alias: TimestampQuerySnapshot

> **TimestampQuerySnapshot** = `object`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L25)

Results belonging to this encoder, even when its query set is reused by later encoders.

## Properties[​](#properties "Direct link to Properties")

### clockCorrelation?[​](#clockcorrelation "Direct link to clockCorrelation?")

> `readonly` `optional` **clockCorrelation?**: [`GPUClockCorrelation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/GPUClockCorrelation.md)

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L27)

## Methods[​](#methods "Direct link to Methods")

### readResults()[​](#readresults "Direct link to readResults()")

> **readResults**(`options?`): `Promise`<`bigint`\[]>

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L26)

#### Parameters[​](#parameters "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

###### firstQuery?[​](#firstquery "Direct link to firstQuery?")

`number`

###### queryCount?[​](#querycount "Direct link to queryCount?")

`number`

#### Returns[​](#returns "Direct link to Returns")

`Promise`<`bigint`\[]>
