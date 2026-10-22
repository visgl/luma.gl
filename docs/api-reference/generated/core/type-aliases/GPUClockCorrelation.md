# Type Alias: GPUClockCorrelation

> **GPUClockCorrelation** = `object`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L17)

Approximate CPU = GPU + offset mapping, scoped to one device and recent submissions. Uncertainty describes submission/callback latency, not hardware timestamp quantization.

## Properties[​](#properties "Direct link to Properties")

### method[​](#method "Direct link to method")

> **method**: `"submission"`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L21)

***

### offsetMilliseconds[​](#offsetmilliseconds "Direct link to offsetMilliseconds")

> **offsetMilliseconds**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L18)

***

### sampledAtCpuTimeMilliseconds[​](#sampledatcputimemilliseconds "Direct link to sampledAtCpuTimeMilliseconds")

> **sampledAtCpuTimeMilliseconds**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L20)

***

### uncertaintyMilliseconds[​](#uncertaintymilliseconds "Direct link to uncertaintyMilliseconds")

> **uncertaintyMilliseconds**: `number`

Defined in: [modules/core/src/api/adapter/resources/command-encoder.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/command-encoder.ts#L19)
